import { Controller, Post, Ip, Headers, Inject, Logger } from '@nestjs/common';
import { Mixpanel } from 'mixpanel';

@Controller('visit')
export class VisitController {
  private readonly logger = new Logger(VisitController.name);
  constructor(@Inject('MIXPANEL_TOKEN') private readonly analytics: Mixpanel) {}

  @Post()
  async visit(@Ip() ip: string, @Headers('BtsUuid') analyticsId: string) {
    try {
      this.analytics.track('Visited Landing Page', {
        ip,
        distinct_id: analyticsId,
      });
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }
  }

  @Post('first')
  async firstVisit(@Ip() ip: string, @Headers('BtsUuid') analyticsId: string) {
    try {
      this.analytics.track('First Visit', {
        ip,
        distinct_id: analyticsId,
      });
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }
  }
}
