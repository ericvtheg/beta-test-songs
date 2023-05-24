import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SongController } from './song.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { HealthController } from './health.controller';
import * as Joi from 'joi';
import Mixpanel from 'mixpanel';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        () => ({
          database: {
            url: process.env.DATABASE_URL,
          },
          stage: process.env.STAGE,
          mixPanel: {
            token: process.env.MIX_PANEL_TOKEN,
          },
        }),
      ],
      validationSchema: Joi.object({
        STAGE: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        MIX_PANEL_TOKEN: Joi.string().required(),
      }),
      isGlobal: true,
    }),
    EmailModule,
  ],
  providers: [
    PrismaService,
    {
      provide: 'MIXPANEL_TOKEN',
      useFactory: (configService: ConfigService) =>
        Mixpanel.init(configService.get('MIX_PANEL_TOKEN') as string, {
          protocol: 'https',
          keepAlive: 'true',
        }),
      inject: [ConfigService],
    },
  ],
  controllers: [SongController, HealthController],
})
export class AppModule {}
