import { NextRequest, NextResponse } from 'next/server';
import {
  validatePatchRequest,
  validateOperations,
  applyPatchOperations,
  formatScimUser,
  formatScimError
} from '@/lib/scim';
import { logger } from '@/lib/utils/logger';
import { User, UserStatus } from '@/types/user';
import { getUserByEmail, updateUser } from '@/lib/actions/user.actions';
import { AccountInfo } from '@/types/organization';
import { OrgActions } from '@/lib/actions/org.actions';

/**
 **  Handle GET /api/scim/v2/Users/{id}
 */
export async function GET(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const accountInfo = await validateToken(req);
    const orgId = accountInfo?.organization?.id;

    if (!orgId) return formatScimError(401, 'Unauthorized');

    const { id } = await params;

    const [user, error] = await getUserByEmail(id);

    if (error || !user) {
      if (error === 'user not found') {
        return formatScimError(404, `User not found: ${id}`);
      }

      throw new Error(error);
    }

    const scimUser = formatScimUser(user, id);

    return NextResponse.json(scimUser, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    logger.error({ error, msg });
    return formatScimError(500, msg);
  }
}

/**
 ** PUT /scim/v2/Users/{id}
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const accountInfo = await validateToken(req);
    const orgId = accountInfo?.organization?.id;

    if (!orgId) return formatScimError(401, 'Unauthorized');

    const { id } = await params;
    const body = await req.json();

    // Validate required fields
    if (!body.userName && !body.emails?.length) {
      return formatScimError(400, 'Missing required fields: userName or emails');
    }

    const email = body?.emails?.[0]?.value || body.userName;

    // Get existing user
    const [existingUser, getError] = await getUserByEmail(email);

    if (getError || !existingUser) {
      if (getError === 'user not found') {
        return formatScimError(404, `User not found: ${id}`);
      }

      throw new Error(getError);
    }

    // map incoming data to internal data
    const updateData: Partial<User> = {
      email,
      first_name: body.name?.givenName || '',
      last_name: body.name?.familyName || '',
      status: body.active === false ? UserStatus.SUSPENDED : UserStatus.ACTIVE
    };

    if (Object.keys(updateData).length === 0) {
      // No changes, return existing user
      const scimUser = formatScimUser(existingUser, id);
      return NextResponse.json(scimUser, { status: 200 });
    }

    // Update user
    const [updatedUser, updateError] = await updateUser({
      userid: email,
      user_info: updateData
    });

    if (updateError) throw new Error(updateError);

    const scimUser = formatScimUser(updatedUser, id);
    return NextResponse.json(scimUser, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    logger.error({ error, msg, fileTrace: 'PUT /scim/v2/Users/{id}' });
    return formatScimError(500, msg);
  }
}

/**
 ** PATCH /scim/v2/Users/{id}
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    // 1. Validate token
    const accountInfo = await validateToken(req);
    const orgId = accountInfo?.organization?.id;

    if (!orgId) return formatScimError(401, 'Unauthorized');

    console.debug('🚀 ~ PATCH ~ organizationId:', orgId);

    const { id } = await params;

    // 2. Parse and validate request
    const body = await req.json();

    console.log('🚀 ~ PATCH ~ body:', body);

    let patchRequest;

    try {
      patchRequest = validatePatchRequest(body);
    } catch (error) {
      const scimError = formatScimError(400, (error as Error).message);
      return NextResponse.json(scimError, { status: 400 });
    }

    console.debug('🚀 ~ PATCH ~ patchRequest:', patchRequest);

    // 3. Validate operations
    try {
      validateOperations(patchRequest.Operations);
    } catch (error) {
      const scimError = formatScimError(400, (error as Error).message);
      return NextResponse.json(scimError, { status: 400 });
    }

    console.debug('✅ SCIM PATCH ~ operations validated');

    // 4. Apply operations to get update data
    const updateData = applyPatchOperations(patchRequest.Operations);

    console.debug('🚀 ~ PATCH ~ updateData:', updateData);

    // 5. Extract externalId (email) from operations or body
    // SCIM spec: externalId is sent in the request

    // 6. Look up user by email
    const [user, error] = await getUserByEmail(id);

    if (error || !user) {
      if (error === 'user not found') {
        return formatScimError(404, `User not found: ${id}`);
      }

      throw new Error(error);
    }

    if (user?.user_account !== orgId) return formatScimError(400, 'user not in organization');

    console.debug('🚀 ~ PATCH ~ user:', user);

    // 7. Check for email conflicts if the email is being updated
    // NOTE: Need to visit this later, if it is required in case of BangDB, otherwise can be removed

    // ----------------------------------------------------------------
    // if (updateData.email && updateData.email !== user.email) {
    //   const [emailTaken, checkUserError] = await checkUserExits(
    //     updateData.email as string,
    //   );
    //
    //   if (checkUserError) throw new Error(checkUserError);
    //
    //   if (emailTaken) {
    //     return formatScimError(
    //       409,
    //       `Email already in use: ${updateData.email}`,
    //     );
    //   }
    // }
    // ----------------------------------------------------------------

    // 8. Build a safe update object
    const safeUpdate = buildUpdateObject(updateData);

    // return success response if nothing to update

    if (Object.keys(safeUpdate).length < 1) {
      const scimUser = formatScimUser(user, id);

      return NextResponse.json(scimUser, { status: 200 });
    }

    console.log('🚀 ~ PATCH ~ safeUpdate:', safeUpdate);

    // 9. Update user in DB
    const [updatedUser, updateError] = await updateUser({
      userid: user.userid,
      user_info: safeUpdate
    });

    if (updateError) throw new Error(updateError);

    // 10. Format and return SCIM response
    const scimUser = formatScimUser(updatedUser, id);

    console.debug('🚀 ~ PATCH ~ scimUser:', scimUser);

    return NextResponse.json(scimUser, { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return formatScimError(500, 'Internal server error');
  }
}

/**
 * DELETE /scim/v2/Users/{id}
 */
export async function DELETE(req: NextRequest) {
  try {
    // 1. Validate token
    const accountInfo = await validateToken(req);
    const orgId = accountInfo?.organization?.id;

    if (!orgId) return formatScimError(401, 'Unauthorized');

    console.debug('🚀 ~ DELETE ~ organizationId:', orgId);

    // 2. Extract externalId from query params or body
    const body = await req.json().catch(() => ({}));
    const externalId = body.externalId || req.nextUrl.searchParams.get('externalId');
    console.debug('🚀 ~ DELETE ~ externalId:', externalId);
    if (!externalId) {
      return formatScimError(400, 'externalId is required');
    }

    // 3. Look up user by email
    const [user, errror] = await getUserByEmail(externalId);

    if (errror || !user) {
      if (errror === 'user not found') {
        return formatScimError(404, `User not found: ${externalId}`);
      }

      throw new Error(errror);
    }

    if (user?.user_account !== orgId) return formatScimError(400, 'user not in organization');

    console.debug('🚀 ~ DELETE ~ user:', user);

    // 4. Hard delete user
    const [updatedUser, deleteError] = await updateUser({
      userid: user.userid,
      user_info: { status: UserStatus.TERMINATED }
    });

    if (deleteError) {
      console.error('Delete error:', deleteError);
      const scimError = formatScimError(500, 'Failed to delete user');
      return NextResponse.json(scimError, { status: 500 });
    }

    console.debug('✅ SCIM DELETE ~ success');

    // 5. Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE error:', error);
    const scimError = formatScimError(500, 'Internal server error');
    return NextResponse.json(scimError, { status: 500 });
  }
}

//*=== Helpers

/**
 * Build and return the user object (from req data) to update in db
 */
function buildUpdateObject(updateData: Record<string, unknown>) {
  const safeUpdate: Record<string, unknown> = {};

  // Only allow specific fields to be updated
  const allowedFields = ['first_name', 'last_name', 'email', 'externalId', 'status'];

  for (const field of allowedFields) {
    if (field in updateData) {
      safeUpdate[field] = updateData[field];
    }
  }

  return safeUpdate;
}

/**
 * Validates req via `Authorization` header
 */
const validateToken = async (req: NextRequest): Promise<AccountInfo | null> => {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) return null;

  const orgAPI = new OrgActions({ userid: 'Example User' });
  const [accountInfo, error] = await orgAPI.getOrgBySCIMToken({
    scimToken: token
  });

  const org = accountInfo?.organization;

  if (error || !org?.id || !org?.ssoEnabled) return null;

  return accountInfo;
};
