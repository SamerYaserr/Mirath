import z from 'zod';

export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum LogLevel {
  HTTP = 'http',
  SILLY = 'silly',
  INFO = 'info',
  ERROR = 'error',
  WARN = 'warn',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  NODE_ENV: z.enum(NodeEnv).default(NodeEnv.DEVELOPMENT),

  LOG_LEVEL: z.enum(LogLevel).default(LogLevel.INFO),
});

export type AppConfig = z.infer<typeof envSchema>;

export const configuration = (): AppConfig => {
  return envSchema.parse(process.env);
};
