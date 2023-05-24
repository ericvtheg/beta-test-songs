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
          mixpanel: {
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
      useFactory: (configService: ConfigService<any, true>) =>
        Mixpanel.init(configService.get('mixpanel.token'), {
          protocol: 'https',
          keepAlive: 'true',
        }),
      inject: [ConfigService],
    },
  ],
  controllers: [SongController, HealthController],
})
export class AppModule {}
