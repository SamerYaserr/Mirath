import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UserSettingsService } from './user-settings.service';

@ApiTags('User Settings')
@ApiBearerAuth()
@Controller('users/settings')
export class UserSettingsController {
  constructor(readonly userSettingsService: UserSettingsService) {}
}
