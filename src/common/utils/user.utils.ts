import { User } from '@prisma/client';

export function excludeUserSensitiveFields(
  user: User,
): Omit<User, 'password' | 'providerId'> {
  const { password, providerId, ...safeUser } = user;
  return safeUser;
}

export function excludeUsersSensitiveFields(
  users: User[],
): Omit<User, 'password' | 'providerId'>[] {
  return users.map(excludeUserSensitiveFields);
}
