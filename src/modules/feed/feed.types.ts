export type PaperCard = {
  id: string;
  title: string;
  abstract: string | null;
  publishedAt: Date;
  authors: string[];
  categories: string[];
};

export type FindRecommendationPapersArgs = {
  tags: string[];
  limit: number;
  offset: number;
  userId: string;
};

export type FindRecommendationPapersRes = {
  papers: PaperCard[];
  total: number;
};

export type FindRecentPapersRes = FindRecommendationPapersRes;

export type FindUserForRecRes = {
  id: string;
  userInterests: { interest: { name: string } }[];
  userFields: { field: { name: string } }[];
} | null;

export type FindRecentPapersArgs = {
  category: string | undefined;
  limit: number;
  offset: number;
};
