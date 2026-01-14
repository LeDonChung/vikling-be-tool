import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Serve static files
  app.use('/static', express.static(path.join(__dirname, '..', '..', 'uploads')));

  await app.listen(process.env.PORT ?? 5000).then(() => {
    Logger.log('Application started successfully: http://localhost:' + (process.env.PORT ?? 5000) , 'Bootstrap');
  });
}
bootstrap();

