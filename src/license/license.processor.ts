import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { LicenseService } from './license.service';

@Processor('license-jobs', {
  concurrency: 1,
})
export class LicenseProcessor extends WorkerHost {
  private readonly logger = new Logger(LicenseProcessor.name);

  constructor(private readonly licenseService: LicenseService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'expire-tokens':
        return this.handleExpireTokens();
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return null;
    }
  }

  private async handleExpireTokens() {
    this.logger.log('Executing expire tokens job...');
    try {
      const result = await this.licenseService.expireTokens();
      this.logger.log(`Successfully expired ${result.expiredCount} tokens`);
      return result;
    } catch (error) {
      this.logger.error('Error during token expiration', error);
      throw error;
    }
  }
}
