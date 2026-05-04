import { UpdateReadingListReqDto } from './dtos/requests/update.req.dto';

export interface OwnerSource {
  id: string;
  username: string;
  fullName: string | null;
  photoUrl: string | null;
}

export interface PaperSource {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  publishedAt: Date;
  citation: string;
  isSaved: boolean;
}

export interface ReadingListPaperRecord {
  readingListId: string;
  paperId: string;
  paper: PaperSource;
}

export interface CreatedListSource {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindOneListSource {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  isSaved: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  papers: ReadingListPaperRecord[];
  owner: OwnerSource;
}

export interface SystemListSource {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { papers: number };
  owner: OwnerSource;
}

export interface UserListSource {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { papers: number };
  owner: OwnerSource;
  papers: { paper: { categories: string[] } }[];
}

export interface AddedPaperRecord {
  readingListId: string;
  paperId: string;
}

export interface SavedReadingList {
  userId: string;
  readingListId: string;
  savedAt: Date;
  readingList: UserListSource;
}

export interface UpdateReadingListServiceParams {
  id: string;
  userId: string;
  data: UpdateReadingListReqDto;
}
