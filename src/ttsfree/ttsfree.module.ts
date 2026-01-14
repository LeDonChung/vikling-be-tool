import { Module } from '@nestjs/common';
import { TtsfreeService } from './ttsfree.service';
import { TtsfreeController } from './ttsfree.controller';

@Module({
  controllers: [TtsfreeController],
  providers: [TtsfreeService],
})
export class TtsfreeModule {}
