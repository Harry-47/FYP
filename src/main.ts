import * as dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']); 

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';4


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');  //To set global prefix for all routes
  
  app.useGlobalPipes(
    new ValidationPipe(
      {
        whitelist: true, // to strip off extra fields
        forbidNonWhitelisted: true, //throw 400 if extra fields provided
        transform: true    //for type casting
      }

    )
  )

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
