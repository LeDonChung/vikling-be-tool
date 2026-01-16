import { Module } from '@nestjs/common';
import { ElabService } from './elelab.service';
import { ElabController } from './elelab.controller';

@Module({
  controllers: [ElabController],
  providers: [ElabService],
  exports: [ElabService],
})
export class ElabModule {}
