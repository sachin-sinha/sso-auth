export const UserRole = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER'
} as const;

export const UserStatus = {
  PWD_CHANGE: 0,
  SUSPENDED: 1,
  TERMINATED: 2,
  ACTIVE: 3
} as const;

type UserRole = (typeof UserRole)[keyof typeof UserRole];
type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export interface User {
  userid: string;
  apikey?: string;
  email: string;
  first_name: string;
  last_name: string;
  custom_info?: { externalId?: string };
  user_role: UserRole;
  status: UserStatus;
  user_account?: string;
}
