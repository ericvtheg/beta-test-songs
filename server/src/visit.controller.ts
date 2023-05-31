import { Controller, Post, Headers, Inject, Logger } from '@nestjs/common';
import { Mixpanel } from 'mixpanel';
import { IpAddress } from './decorators/ip.decorator';

@Controller('visit')
export class VisitController {
  private readonly logger = new Logger(VisitController.name);
  constructor(@Inject('MIXPANEL_TOKEN') private readonly analytics: Mixpanel) {}

  @Post()
  async visit(
    @IpAddress() ip: string,
    @Headers('BtsUuid') analyticsId: string,
  ) {
    try {
      this.analytics.track('Visited Landing Page', {
        $ip: ip,
        distinct_id: analyticsId,
      });
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }
  }

  @Post('first')
  async firstVisit(
    @IpAddress() ip: string,
    @Headers('BtsUuid') analyticsId: string,
  ) {
    try {
      this.analytics.track('First Visit', {
        $ip: ip,
        distinct_id: analyticsId,
      });
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }
  }
}
