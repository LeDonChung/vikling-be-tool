import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { LicenseService } from './license.service';
import { LicenseController, AdminTokenController } from './license.controller';
import { Token } from 'src/entities/token.entity';
import { TokenDevice } from 'src/entities/token-device.entity';
import { LicenseProcessor } from './license.processor';
import { LicenseGuard } from './guards/license.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, TokenDevice]),
    BullModule.registerQueue({ name: 'license-jobs' }),
  ],
  controllers: [LicenseController, AdminTokenController],
  providers: [LicenseService, LicenseProcessor, LicenseGuard],
  exports: [LicenseService, LicenseGuard],
})
export class LicenseModule {}
