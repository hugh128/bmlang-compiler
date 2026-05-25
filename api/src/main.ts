import { NestFactory }    from '@nestjs/core';
import { AppModule }      from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin:  '*',
    methods: ['GET', 'POST'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform:            true,
      whitelist:            true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  await app.listen(4000);
  console.log('🚀 BMLang API  →  http://localhost:4000/api');
  console.log('   Health       →  http://localhost:4000/api/compiler/health');
  console.log('   Diagnostics  →  http://localhost:4000/api/compiler/diagnostics');
}
bootstrap();
