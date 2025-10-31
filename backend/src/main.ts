import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',  // Frontend dev server
      'http://localhost:3002',  // Alternative frontend ports
      'http://localhost:3000',  
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const res = await app.listen(process.env.PORT ?? 3000);

  console.log("app : ", res._connectionKey);
}
bootstrap();
