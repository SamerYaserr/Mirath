import { FieldOfStudy, Interest, User } from '@prisma/client';

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
