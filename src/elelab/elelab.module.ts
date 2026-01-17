import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElabService } from './elelab.service';
import { ElabController } from './elelab.controller';
import { LicenseModule } from 'src/license/license.module';
import { Token } from 'src/entities/token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token]),
    LicenseModule,
  ],
  controllers: [ElabController],
  providers: [ElabService],
  exports: [ElabService],
})
export class ElabModule {}
