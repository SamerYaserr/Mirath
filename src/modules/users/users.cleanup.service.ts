import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersCronService {
  private readonly logger = new Logger(UsersCronService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredAccountDeletion(): Promise<void> {
    this.logger.log('Starting expired account deletion job');

    try {
      const deletedIds = await this.usersRepository.deleteExpiredAccounts();

      if (deletedIds.length === 0) {
        this.logger.log('No expired accounts found to delete');
        return;
      }

      for (const id of deletedIds) {
        this.logger.log(`Permanently deleted user ${id}`);
      }
    } catch (error) {
      this.logger.error('Failed to delete expired accounts', error);
    }
  }
}
