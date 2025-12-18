import { compileFilter } from 'scim-query-filter-parser';
import { formatScimUser, formatScimListResponse, formatScimError } from '@/lib/scim';
import { User, UserRole, UserStatus } from '@/types/user';
import { NextRequest, NextResponse } from 'next/server';
import { generatePassword } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { OrgActions } from '@/lib/actions/org.actions';
import { getUserByEmail } from '@/lib/actions/user.actions';
import { createUser, getAccountUsers } from '@/lib/actions/auth.actions';
import { authTokenPayload } from '@/lib/actions/verifications.actions';
import type { AccountInfo } from '@/types/organization';

// const sample_token = 'sk_scim_tyHcxImyFcQMfCoHZFsJdhb7eIUtkfMTTJJwTZHGXamhgo4BGZXQ';

/**
 **  Handle GET /api/scim/v2/Users
 */
export async function GET(req: NextRequest) {
  try {
    const accountInfo = await validateToken(req);
    const orgId = accountInfo?.organization?.id;

    if (!orgId) return formatScimError(401, 'Unauthorized');

    // Parse and validate pagination
    const pagination = parsePaginationParams(req.nextUrl.searchParams);

    const filterParam = req.nextUrl.searchParams.get('filter') || '';

    const simpleFilterMatch = filterParam?.match(/(\w+)\s+eq\s+"([^"]+)"/) || null;

    console.debug('🚀 ~ handleGetUsers ~ pagination:', pagination);

    // Parse and validate filter
    const filterFn = parseFilterQuery(filterParam);

    let filteredUsers: User[] = [];

    // if a simple filter like `email eq` then get only that user, else fallback to getting all users

    if (simpleFilterMatch && filterParam) {
      console.log('🚀 ~ GET ~ simpleFilterMatch:', simpleFilterMatch);
      const [, , fieldValue] = simpleFilterMatch;

      // Query a single user directly
      const [user, error] = await getUserByEmail(fieldValue);

      if (error || !user) {
        if (error === 'user not found') {
          return NextResponse.json(formatScimListResponse([], []), {
            status: 200
          });
        }

        throw new Error(error);
      }

      filteredUsers = user ? [user] : [];
    } else {
      // Complex filter - fall back to fetching all and filtering in memory
      const res = await getAccountUsers(
        authTokenPayload({
          op: 1,
          user_account: orgId
          // limit: pagination.count,
          // page: pagination.startIndex - 1,
        })
      );

      if (res?.error) throw new Error(res?.error?.[0]);

      const allUsers = res?.users || [];

      if (filterParam) {
        const filterFn = compileFilter(filterParam);
        filteredUsers = allUsers.filter(filterFn);
      } else {
        filteredUsers = allUsers;
      }
    }

    // Apply filter if provided
    if (filterFn && filteredUsers?.length) {
      // Convert users to format filterFn expects (with userName, email, etc.)
      const usersForFilter = filteredUsers.map(user => ({
        userName: user?.email,
        email: user?.email,
        givenName: user?.first_name,
        familyName: user?.last_name,
        active: user?.status === UserStatus.ACTIVE
      }));

      filteredUsers = usersForFilter
        .map((u, idx) => ({ user: filteredUsers[idx], filtered: u }))
        .filter(({ filtered }) => filterFn(filtered))
        .map(({ user }) => user);
    }

    console.debug('🚀 ~ handleGetUsers ~ filteredUsers:', filteredUsers);

    // Apply pagination
    const paginatedUsers = paginateResults(filteredUsers, pagination.startIndex, pagination.count);

    console.log('🚀 ~ GET ~ paginatedUsers:', paginatedUsers);

    // Generate SCIM IDs (in your case, using email as a unique identifier)
    const scimIds = paginatedUsers.map(user => user.email);

    // Format response
    const responseBody = formatScimListResponse(paginatedUsers, scimIds);

    console.debug('🚀 ~ GET ~ responseBody:', responseBody);

    const { count: totalCount } = await getAccountUsers(authTokenPayload({ op: 99, user_account: orgId }));

    if (!totalCount && totalCount !== 0) throw new Error('Failed to get the total count of users');

    // Override totalResults to reflect pre-pagination total
    responseBody.totalResults = totalCount;
    responseBody.startIndex = pagination.startIndex;
    responseBody.itemsPerPage = paginatedUsers.length;

    console.debug('🚀 ~ handleGetUsers ~ responseBody:', responseBody);

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    logger.error({ error, msg });
    return formatScimError(500, msg);
  }
}

/**
 ** POST /api/scim/v2/Users
 */
export async function POST(req: NextRequest) {
  try {
    const accountInfo = await validateToken(req);
    const orgId = accountInfo?.organization?.id;
    const orgOwner = accountInfo?.owner;

    if (!orgId) return formatScimError(401, 'Unauthorized');

    const body = await req.json();

    // Validate required fields
    if (!body.userName && !body.emails?.length)
      return formatScimError(400, 'Missing required fields: userName or emails');

    const email = body?.emails?.[0]?.value || body.userName;

    // Check if a user already exists (idempotency)
    const [existingUser, error] = await getUserByEmail(email);

    if (error && error !== 'user not found') {
      throw new Error(error);
    }

    // return 409 Conflict with existing resource
    if (existingUser) return formatScimError(409, `User with email ${email} already exists`);

    // Create a new user
    const newUser: User = {
      userid: email,
      email,
      first_name: body.name?.givenName || '',
      last_name: body.name?.familyName || '',
      user_role: UserRole.MEMBER, // Default role from SCIM provisioning
      status: body.active === false ? UserStatus.SUSPENDED : UserStatus.ACTIVE
    };

    // Create the user in the userservice

    await createUser(
      authTokenPayload({
        user_info: {
          ...newUser,
          name: newUser?.first_name + ' ' + newUser?.last_name,
          license: 'L1',
          user_type: 'POWER',
          power_user: orgOwner,
          pwd: generatePassword()
        },

        signup: 1
      })
    );

    // Return the created resource
    const scimUser = formatScimUser(newUser, email);
    return NextResponse.json(scimUser, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    logger.error({ error, msg });
    return formatScimError(500, msg);
  }
}

//*=== HELPERS

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

interface PaginationParams {
  startIndex: number;
  count: number;
}
/**
 * Parses pagination params from search query
 */
function parsePaginationParams(query: URLSearchParams): PaginationParams {
  const startIndex = Number(query.get('startIndex') || 1);
  const count = Number(query.get('count') || 50);

  // Validate ranges
  if (startIndex < 1) throw new Error('startIndex must be >= 1');
  if (count < 1) throw new Error('count must be >= 1');
  if (count > 500) throw new Error('count cannot exceed 500');
  return { startIndex, count };
}

/**
 * Paginate items that are to be returned to the IdP
 */
function paginateResults<T>(items: T[], startIndex: number, count: number): T[] {
  const index = startIndex - 1; // SCIM uses 1-based indexing
  return items.slice(index, index + count);
}

/**
 * Parses filter from the url search query
 */
function parseFilterQuery(filterParam?: string) {
  if (!filterParam) return null;

  try {
    return compileFilter(filterParam);
  } catch (error) {
    throw new Error(`Invalid SCIM filter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
