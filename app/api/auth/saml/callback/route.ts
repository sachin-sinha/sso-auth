import { XMLParser } from 'fast-xml-parser';
import { NextRequest, NextResponse } from 'next/server';

import { User, UserRole, UserStatus } from '@/types/user';
import type { SAMLAttributeKeyMapping, Organization, AccountInfo } from '@/types/organization';

import { api } from '@/lib/utils/api';
import { generatePassword } from '@/lib/utils';
import { initIdentityProvider, initServiceProvider, setupSAMLValidator } from '@/lib/saml';
import { logger } from '@/lib/utils/logger';
import { OrgActions } from '@/lib/actions/org.actions';
import { getUserByEmail } from '@/lib/actions/user.actions';
import { createApiKey, createUser } from '@/lib/actions/auth.actions';
import { authTokenPayload } from '@/lib/actions/verifications.actions';
import { setCookie } from '@/lib/actions/cookie.actions';

/**
 ** POST /api/auth/saml/callback
 * SAML IdP send user's to this endpoint after completing the auth from their end
 *
 * Here, we verify SAML response assertion > authenticate user > redirect to the app
 */
export async function POST(request: NextRequest) {
  try {
    // 1. read the form data from the POST request
    const formData = await request.formData();

    // 2. extract SAMLResponse first (needed for both flows)
    const samlResponse = formData.get('SAMLResponse') as string;
    if (!samlResponse) return api.ErrorRes(400, 'SAML response not found');

    // 3. determine orgId - either from RelayState or email domain
    let orgId: string | null = null;
    let accountInfo: AccountInfo | null = null;
    let org: Organization | null = null;
    let orgError: string | null = null;

    const relayState = formData.get('RelayState') as string | null;
    const orgAPI = new OrgActions({ userid: '' });

    if (relayState) {
      // SP-Initiated: Extract orgId from RelayState
      try {
        const decoded = JSON.parse(Buffer.from(relayState, 'base64').toString());
        orgId = decoded.orgId;

        if (!orgId) throw new Error('orgId is missing in relayState');

        [accountInfo, orgError] = await orgAPI.getOrgById({
          id: orgId
        });

        if (accountInfo?.organization) org = accountInfo.organization;
      } catch (e) {
        return api.ErrorRes(400, `Invalid relayState: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    } else {
      // IdP-Initiated: Need to extract email from SAML response
      // Decode and decompress the SAML response to extract email
      try {
        const decodedSAML = Buffer.from(samlResponse, 'base64').toString('utf8');

        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_'
        });

        const parsed = parser.parse(decodedSAML);

        // navigate through SAML2 response structure to find NameID
        const nameID =
          parsed['saml2p:Response']?.['saml2:Assertion']?.['saml2:Subject']?.['saml2:NameID']?.['#text'];

        if (!nameID || !nameID.includes('@')) {
          return api.ErrorRes(
            400,
            'Cannot determine organization: no RelayState and invalid email in SAML response'
          );
        }

        const emailDomain = nameID.split('@')[1];
        [accountInfo, orgError] = await orgAPI.getOrgByDomain({
          domain: emailDomain
        });

        if (accountInfo?.organization) org = accountInfo.organization;

        if (!org?.id) {
          return api.ErrorRes(400, `No organization found for domain: ${emailDomain}`);
        }

        orgId = org.id;
      } catch (e) {
        return api.ErrorRes(
          500,
          `Failed to parse IdP-initiated request: ${e instanceof Error ? e.message : 'unknown error'}`
        );
      }
    }

    if (orgError || !org?.id) return api.ErrorRes(500, orgError || 'Failed to fetch organization');

    if (!org?.samlConfig || !org.samlConfig?.metadata?.attributes) {
      return api.ErrorRes(400, 'SAML SSO not configured for this organization');
    }

    if (!org.ssoEnabled) return api.ErrorRes(400, 'SSO not enabled for this organization');

    console.debug('🚀 ~ POST ~ samlConfig:', org.samlConfig);

    setupSAMLValidator();

    // 5. initialize SP (us) and IdP provider for assertion and verification
    const sp = initServiceProvider(org.samlConfig.callbackURL);
    const idp = initIdentityProvider(org.samlConfig);

    // 6. parse and validate SAML response
    const { extract } = await sp.parseLoginResponse(idp, 'post', {
      body: { SAMLResponse: samlResponse }
    });

    // 7. extract user details from SAML response attributes
    const attrKeyMapping = org.samlConfig.metadata.attributes;

    console.debug('🚀 ~ POST ~ /callback ~ attrKeyMapping:', attrKeyMapping);
    console.debug("🚀 ~ POST ~ /callback ~ extract?.['attributes']:", extract?.['attributes']);

    const userAttrs = extractAttrs(extract?.['attributes'], attrKeyMapping);

    console.debug('🚀 ~ POST /callback ~ userAttrs:', userAttrs);

    if (!userAttrs) throw new Error('Failed to extract user attributes from SAML response');

    // 8. create / update user
    const [userEmail, userApikey, provisionError] = await provisionUser({
      orgId,
      userAttrs,
      owner: accountInfo?.owner
    });

    if (provisionError) throw new Error(provisionError);

    // 9. Trigger authentication flow for the user

    const cookieTTL = 60 * 60 * 24 * 7; // 7 days in seconds
    await setCookie('bdb_userid', userEmail, cookieTTL);
    await setCookie('bdb_apikey', userApikey, cookieTTL);

    // 10. Redirect the user to the app
    const redirectPath = `/`;
    return NextResponse.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error('SAML processing error:', error);
    return api.ErrorRes(500, 'Failed to process SAML response');
  }
}

//*=== Helpers

// TODO: handle error and success redirects

// const handleErrors = (msg = '', code = 500) => {
//   return NextResponse.redirect(
//     new URL(`/login?saml_error=${encodeURIComponent(msg)}&code=${code}`, process.env.NEXT_PUBLIC_APP_URL)
//   );
// };

/**
 * Check if the user already exists or create a new user if they do not
 * @param orgId - organization id of the user
 * @param userAttrs - attributes from the SAML Assertion response
 * @param owner - owner of the organization
 * @returns [email, apikey, error]
 */
const provisionUser = async ({
  orgId,
  userAttrs,
  owner
}: {
  orgId: string;
  userAttrs: UserAttrs;
  owner?: string;
}): Promise<[string, string, string]> => {
  try {
    if (!userAttrs) throw new Error('Invalid user attribute data, at saml assertion response');

    const {
      email,
      first_name,
      last_name
      // groups
    } = userAttrs;

    const [existingUser] = await getUserByEmail(userAttrs.email);

    const user: User = {
      userid: email,
      email,
      first_name,
      last_name,
      status: existingUser?.status || UserStatus.ACTIVE,
      user_role: existingUser?.user_role || UserRole.MEMBER
    };

    // only create user if new
    if (!existingUser) {
      const createPayload = authTokenPayload({
        user_info: {
          ...user,
          name: first_name + ' ' + last_name,
          license: 'L1',
          user_type: 'POWER',
          power_user: owner,
          pwd: generatePassword()
        }
      });

      console.log({ createPayload });
      const create = await createUser(createPayload);
      console.log({ create });

      if (create?.error) throw new Error('Failed to create the user');

      const generateApikey = await createApiKey(authTokenPayload({ userid: email }));

      if (generateApikey?.error) throw new Error('Failed to generate apikey for the user');

      user.apikey = generateApikey?.apikey;
    }

    return [email, existingUser?.apikey || user?.apikey || '', ''];
  } catch (error) {
    const msg = 'Failed to provision user';
    logger.error({ error, msg, fields: { orgId, userAttrs } });
    return ['', '', msg];
  }
};

type UserAttrs = Pick<User, 'email' | 'first_name' | 'last_name'>;

/*
 * MS Entra Attr sample

    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'manish',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname': 'mandal',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'manish.mandal@bangdbcom.onmicrosoft.com'
 */

/**
 * Extract attributes values for the given `keyMapping` from `attrs`
 *
 * returns `null` if even one required attribute is missing
 */
const extractAttrs = (
  attrs: Record<string, unknown>,
  keyMapping: SAMLAttributeKeyMapping
): UserAttrs | null => {
  const userAttr: UserAttrs = {
    email: '',
    first_name: '',
    last_name: ''
    // groups: (attrs["groups"] as string[]) || [],
  };

  if (keyMapping.email in attrs) {
    userAttr.email = attrs[keyMapping.email] as string;
  }

  if (keyMapping.first_name in attrs) {
    userAttr.first_name = attrs[keyMapping.first_name] as string;
  }

  if (keyMapping.last_name in attrs) {
    userAttr.last_name = attrs[keyMapping.last_name] as string;
  }

  if (!userAttr.email || !userAttr.first_name || !userAttr.last_name) return null;

  return userAttr;
};
