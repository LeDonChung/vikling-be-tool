import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';
import { ProxyProcessor } from './proxy.processor';
import { LicenseModule } from 'src/license/license.module';
import { Token } from 'src/entities/token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token]),
    BullModule.registerQueue({
      name: 'proxy-check',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 2,
      },
    }),
    LicenseModule,
  ],
  controllers: [ProxyController],
  providers: [ProxyService, ProxyProcessor],
  exports: [ProxyService],
})
export class ProxyModule {}
