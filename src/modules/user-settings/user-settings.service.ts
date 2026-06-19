import { Injectable } from '@nestjs/common';

import { UserSettingsRepository } from './repositories/user-settings.repository';

@Injectable()
export class UserSettingsService {
  constructor(readonly userSettingsRepository: UserSettingsRepository) {}
}
