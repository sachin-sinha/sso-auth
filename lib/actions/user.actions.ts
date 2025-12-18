import { User } from '@/types/user';
import { logger } from '@/lib/utils/logger';
import { getUserInfo, updateUserInfo } from '@/lib/actions/auth.actions';
import { authTokenPayload } from '@/lib/actions/verifications.actions';

type SingleUserResponse = Promise<[User | null, string]>;

/**
 * Returns `user` by `email` if it exists
 */
export async function getUserByEmail(email: string): SingleUserResponse {
  try {
    const userInfo = await getUserInfo(authTokenPayload({ userid: email }));

    if (userInfo?.userid) {
      return [userInfo as User, ''];
    }

    return [null, 'user not found']; // Return error
  } catch (error) {
    const msg = 'Failed to get user by email';
    logger.error({ error, msg, fields: { email } });
    return [null, msg];
  }
}

export async function updateUser({ userid, user_info }: { userid: string; user_info: Partial<User> }) {
  try {
    const res = await updateUserInfo(authTokenPayload({ userid, user_info }));

    if (res?.error) {
      return [null, res.error?.[0]];
    }

    return [res, ''];
  } catch (error) {
    const msg = 'Failed to update user';
    logger.error({ error, msg });

    return [null, msg];
  }
}
