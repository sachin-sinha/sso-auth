import { SAMLConfig } from '@/types/organization';
import { api } from '@/lib/utils/api';
import { NextRequest } from 'next/server';
import { getAccountInfo } from '@/lib/actions/auth.actions';
import { generateLoginURL } from '@/lib/saml';
import { authTokenPayload } from '@/lib/actions/verifications.actions';

export async function GET(request: NextRequest) {
  try {
    // Parse request body
    const queries = request.nextUrl.searchParams;
    const email = queries.get('email') || '';

    if (!email) return api.ErrorRes(400, 'Email required');

    // Extract the domain from email
    const emailDomain = email.split('@')[1];

    if (!emailDomain) return api.ErrorRes(400, 'Invalid email domain');

    // Get the organization by domain
    const res = await getAccountInfo(
      authTokenPayload({
        userid: email,
        option: 'all',
        filter: `(organization.domain = "${emailDomain}")`
      })
    );

    console.log('🚀 ~ GET ~ res:', res);
    if (!res || !res.rows || res.rows.length === 0) {
      return api.ErrorRes(404, `Organization not found for "${emailDomain}"`);
    }

    const row = res?.rows[0];

    if (!row?.v) return api.ErrorRes(404, `Organization data is invalid for "${emailDomain}"`);

    if (row?.v) {
      const parsedAccountInfo = JSON.parse(row.v);

      if (!parsedAccountInfo?.organization?.ssoEnabled) {
        // Check if SSO is enabled for this organization
        return api.ErrorRes(403, 'SSO is not configured for this organization, please contact the admin');
      } else if (!parsedAccountInfo?.organization?.samlConfig) {
        // Check if SAML is configured for this organization
        return api.ErrorRes(403, 'SAML configuration is not setup for this organization');
      } else {
        const ssoLoginURL = generateLoginURL(
          parsedAccountInfo?.organization?.samlConfig as SAMLConfig,
          parsedAccountInfo?.organization?.id
        );

        return api.SuccessRes('SSO login url', { ssoURL: ssoLoginURL });
      }
    }
  } catch (error) {
    console.error('SSO org lookup error:', error);
    return api.ErrorRes(500, 'Failed to lookup organization, try again');
  }
}
