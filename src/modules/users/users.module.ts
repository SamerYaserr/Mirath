import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { InterestsModule } from '../interests/interests.module';
import { UsersController } from './users.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [InterestsModule, CloudinaryModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
