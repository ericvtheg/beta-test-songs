import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SongController } from './song.controller';
import { SESClient } from '@aws-sdk/client-ses';
import { EmailService } from './email/email.service';

@Module({
  imports: [],
  controllers: [SongController],
  providers: [
    PrismaService,
    {
      provide: SESClient,
      useValue: new SESClient({ region: 'us-east-2' }),
    },
    EmailService,
  ],
})
export class AppModule {}
