import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import mjml2html from 'mjml';
import { readFileSync } from 'fs';
import * as path from 'path';

interface IEmailParams {
  email: string;
  songId: number;
}

@Injectable()
export class EmailService {
  private html: string;
  constructor(private readonly ses: SESClient) {
    const emailFilePath = path.join(__dirname, './pages/song-reviewed.mjml');
    const tpl = readFileSync(emailFilePath).toString();
    this.html = mjml2html(tpl, { minify: true }).html;
  }

  async notifyOfReviewCompleted({
    email,
    songId,
  }: IEmailParams): Promise<void> {
    const html = this.html.replace(
      '{{review_link}}',
      `https://betatestsongs.com/song/id/${songId}`,
    );

    const command = new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Your Song Has Been Reviewed' },
        Body: {
          Html: {
            Data: html,
          },
        },
      },
      Source: 'someemail@gmail.com', // TODO add system email
    });
    await this.ses.send(command);
  }
}
