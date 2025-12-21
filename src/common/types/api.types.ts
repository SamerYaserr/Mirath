export type HttpResponse<T = any> = {
  message?: string;
  data?: T;
  size?: number;
};
