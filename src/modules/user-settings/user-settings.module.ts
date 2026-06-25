import { Module } from '@nestjs/common';

import { UserSettingsController } from './user-settings.controller';
import { UserSettingsService } from './user-settings.service';
import { UserSettingsRepository } from './repositories/user-settings.repository';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { ReadingListsModule } from '../reading-lists/reading-lists.module';
import { PaperAnnotationsModule } from '../paper-annotations/paper-annotations.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    MailModule,
    ReadingListsModule,
    PaperAnnotationsModule,
  ],
  controllers: [UserSettingsController],
  providers: [UserSettingsService, UserSettingsRepository],
  exports: [UserSettingsRepository],
})
export class UserSettingsModule {}
