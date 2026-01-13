import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001).then(() => {
    Logger.log('Application started successfully: http://localhost:' + (process.env.PORT ?? 3001) , 'Bootstrap');
  });
}
bootstrap();
