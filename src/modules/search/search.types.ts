import { LevelOfEducation } from '@prisma/client';

export interface UserSource {
  id: string;
  fullName: string | null;
  username: string;
  photoUrl: string | null;
  followings: { followerId: string }[];
}

export interface DiscussionResult {
  id: string;
  title: string;
  content: string;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  topics: { interest: { name: string } }[];
  author: UserSource;
}

export interface SearchHistoryRecord {
  id: string;
  query: string;
  userId: string;
  createdAt: Date;
}

export interface ReadingListResult {
  id: string;
  title: string;
  updatedAt: Date;
  _count: { papers: number };
  savedReadingLists: { userId: string }[];
  owner: UserSource;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
}

export interface ResearcherResult {
  id: string;
  fullName: string | null;
  username: string;
  bio: string | null;
  university: string | null;
  country: string | null;
  photoUrl: string | null;
  followings: { followerId: string }[];
  levelOfEducation: LevelOfEducation | null;
}
