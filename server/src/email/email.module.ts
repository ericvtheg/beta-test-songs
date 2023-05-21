import { Module } from '@nestjs/common';
import { SESClient } from '@aws-sdk/client-ses';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { startLocalEmailServer } from './local-server';
@Module({
  providers: [
    EmailService,
    {
      provide: 'LocalEmailServer',
      useFactory: async (configService: ConfigService) => {
        const isLocal = configService.get('STAGE') === 'local';
        if (isLocal) {
          return startLocalEmailServer();
        }
      },
      inject: [ConfigService],
    },
    {
      provide: SESClient,
      useFactory: (configService: ConfigService) => {
        const isLocal = configService.get('STAGE') === 'local';
        return new SESClient({
          region: 'us-east-2',
          endpoint: isLocal ? 'http://localhost:8005' : undefined,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
