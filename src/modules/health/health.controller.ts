import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller({
  version: '',
  path: 'health',
})
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Simple liveness probe (fast, no heavy checks)
   * GET /health
   */
  @Get()
  getLiveness() {
    return this.healthService.getLiveness();
  }

  /**
   * Readiness probe (includes DB check using Prisma)
   * GET /health/ready
   */
  @Get('ready')
  async getReadiness() {
    return this.healthService.getReadiness();
  }
}
