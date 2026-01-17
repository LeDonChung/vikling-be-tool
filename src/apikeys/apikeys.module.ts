import { Module } from '@nestjs/common';
import { ApiKeysService } from './apikeys.service';
import { ApiKeysController } from './apikeys.controller';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
