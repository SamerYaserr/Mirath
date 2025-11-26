import z from 'zod';

export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  NODE_ENV: z.enum(NodeEnv).default(NodeEnv.DEVELOPMENT),
});

export type AppConfig = z.infer<typeof envSchema>;

export const configuration = (): AppConfig => {
  return envSchema.parse(process.env);
};
