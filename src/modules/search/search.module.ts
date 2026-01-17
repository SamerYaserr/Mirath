import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchHistoryRepository } from './repositories/search-history.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [SearchService, SearchHistoryRepository],
  controllers: [SearchController],
})
export class SearchModule {}
