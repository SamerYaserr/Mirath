import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repository';
import { InterestsModule } from '../interests/interests.module';
import { UsersController } from './users.controller';

@Module({
  imports: [InterestsModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UserRepository],
})
export class UsersModule {}
