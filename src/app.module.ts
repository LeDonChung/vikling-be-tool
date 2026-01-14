import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullConfigModule } from './bull/bull.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmAsyncConfig } from './common/config/typeorm.config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JobsModule } from './jobs/jobs.module';
import { GeminiModule } from './gemini/gemini.module';
import { OpenaiModule } from './openai/openai.module';
import { GrokModule } from './grok/grok.module';
import { TtsfreeModule } from './ttsfree/ttsfree.module';
import configuration from './common/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync(TypeOrmAsyncConfig),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10000, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 10000, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 10000, // 100 requests per minute
      },
    ]),
    BullConfigModule,
    JobsModule,
    GeminiModule,
    OpenaiModule,
    GrokModule,
    TtsfreeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
