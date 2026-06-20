import { FieldOfStudy, Interest, Prisma, User } from '@prisma/client';

export type FormattedProfile = Partial<User> & {
  interests: Partial<Interest>[];
  fieldsOfStudy: Partial<FieldOfStudy>[];
  followersCount: number;
  followingCount: number;
};

export type FormattedProfileWithMeta = FormattedProfile & {
  isMe: boolean;
  isFollowing: boolean;
};

export type FindByEmailOrUsernameArgs = {
  email: string;
  username: string;
  select?: Prisma.UserSelect;
  where?: Prisma.UserWhereInput;
};
