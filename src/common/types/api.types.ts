export type HttpResponse<T = any> = {
  message?: string;
  data?: T;
  size?: number;
};

export type QueryString = {
  page?: string;
  sort?: string;
  limit?: string;
} & Record<string, any>;
