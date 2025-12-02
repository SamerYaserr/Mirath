import { defineConfig } from 'prisma/config';
import { configuration } from './configuration';

const config = configuration();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: config.DATABASE_URL,
  },
});
