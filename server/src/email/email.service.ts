import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { Injectable } from '@nestjs/common';
import mjml2html from 'mjml';
import { readFileSync } from 'fs';
import * as path from 'path';

interface IEmailParams {
  email: string;
  songId: string;
}

@Injectable()
export class EmailService {
  private html: string;
  constructor(private readonly ses: SESv2Client) {
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
      `https://betatestsongs.com/song/id/${songId}?origin=email`,
    );

    const command = new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Content: {
        Simple: {
          Subject: {
            Data: 'Your Song Has Been Reviewed',
          },
          Body: {
            Html: {
              Data: html,
            },
          },
        },
      },
      FromEmailAddress: 'notify@betatestsongs.com',
    });
    await this.ses.send(command);
  }
}
