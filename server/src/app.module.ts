import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SongController } from './song.controller';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { HealthController } from './health.controller';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        () => ({
          database: {
            url: process.env.DATABASE_URL,
          },
          stage: process.env.STAGE,
        }),
      ],
      validationSchema: Joi.object({
        STAGE: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
      }),
      isGlobal: true,
    }),
    EmailModule,
  ],
  controllers: [SongController, HealthController],
  providers: [PrismaService],
})
export class AppModule {}
