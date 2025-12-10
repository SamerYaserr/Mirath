import { User } from '@prisma/client';

export function excludeUserSensitiveFields(user: User) {
  const { password, providerId, ...safeUser } = user;
  return safeUser;
}

export function excludeUsersSensitiveFields(users: User[]) {
  return users.map(excludeUserSensitiveFields);
}
