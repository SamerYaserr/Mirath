import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { InterestsModule } from '../interests/interests.module';
import { UsersController } from './users.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { FollowsRepository } from './repositories/follows.repository';
import { UsersCronService } from './users.cleanup.service';

@Module({
  imports: [InterestsModule, CloudinaryModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    FollowsRepository,
    UsersCronService,
  ],
  exports: [UsersRepository, UsersService, FollowsRepository],
})
export class UsersModule {}
