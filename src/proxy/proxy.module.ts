import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';
import { ProxyProcessor } from './proxy.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'proxy-check',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 2,
      },
    }),
  ],
  controllers: [ProxyController],
  providers: [ProxyService, ProxyProcessor],
  exports: [ProxyService],
})
export class ProxyModule {}
