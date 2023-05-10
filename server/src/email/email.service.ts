import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly ses: SESClient) {}

  async send(): Promise<void> {
    const command = new SendEmailCommand({
      Destination: { ToAddresses: ['test@gmail.com'] },
      Message: {
        Subject: { Data: 'test subject' },
        Body: { Text: { Data: 'test body' }, Html: { Data: 'test html' } },
      },
      Source: 'someemail@gmail.com',
    });
    await this.ses.send(command);
  }
}
