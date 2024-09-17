import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'api' },
      transports:
        process.env.NODE_ENV === 'production'
          ? [new winston.transports.File({ filename: 'server.log' })]
          : [
              new winston.transports.File({ filename: 'server.log' }),
              new winston.transports.Console({
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.ms(),
                  nestWinstonModuleUtilities.format.nestLike('API', {
                    colors: true,
                    prettyPrint: true,
                    processId: true,
                    appName: true,
                  }),
                ),
              }),
            ],
    }),
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );
  await app.listen(process.env.PORT);
}
bootstrap();