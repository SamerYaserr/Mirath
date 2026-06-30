import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { configuration } from './config/configuration';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { UsersModule } from './modules/users/users.module';
import { UserSettingsModule } from './modules/user-settings/user-settings.module';
import { InterestsModule } from './modules/interests/interests.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { LibraryModule } from './modules/library/library.module';
import { SearchModule } from './modules/search/search.module';
import { PapersModule } from './modules/papers/papers.module';
import { FeedModule } from './modules/feed/feed.module';
import { ReadingListsModule } from './modules/reading-lists/reading-lists.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { CommentsModule } from './modules/comments/comments.module';
import { PaperAnnotationsModule } from './modules/paper-annotations/paper-annotations.module';
import ChatbotModule from './modules/chatbot/chatbot.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    HealthModule,
    AuthModule,
    MailModule,
    UsersModule,
    UserSettingsModule,
    InterestsModule,
    PapersModule,
    LibraryModule,
    SearchModule,
    FeedModule,
    ReadingListsModule,
    DiscussionsModule,
    CommentsModule,
    PaperAnnotationsModule,
    ChatbotModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

