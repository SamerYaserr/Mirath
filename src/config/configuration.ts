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

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),

  // Preprocess: if user provided "Name <email>" extract the email for validation
  EMAIL_FROM: z.preprocess((val) => {
    if (typeof val === 'string') {
      const m = val.match(/<([^>]+)>$/);
      return m ? m[1] : val;
    }
    return val;
  }, z.string().email().optional()),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().url(),
});

export type AppConfig = z.infer<typeof envSchema>;

export const configuration = (): AppConfig => {
  return envSchema.parse(process.env);
};
