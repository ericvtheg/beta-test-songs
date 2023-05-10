import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';

interface IEmailParams {
  toAddress: string;
  link: string;
}

@Injectable()
export class EmailService {
  constructor(private readonly ses: SESClient) {}

  async notifyOfReviewCompleted(): Promise<void> {
    const command = new SendEmailCommand({
      Destination: { ToAddresses: ['test@gmail.com'] },
      Message: {
        Subject: { Data: 'Your Track has been reviewed!' },
        Body: { Text: { Data: 'test body' }, Html: { Data: 'test html' } },
      },
      Source: 'someemail@gmail.com',
    });
    await this.ses.send(command);
  }
}
