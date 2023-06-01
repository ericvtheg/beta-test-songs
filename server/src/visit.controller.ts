import { Controller, Post, Inject, Logger } from '@nestjs/common';
import { Mixpanel } from 'mixpanel';
import { Analytics, IRequestAnalytics } from './decorators/analytics.decorator';

@Controller('visit')
export class VisitController {
  private readonly logger = new Logger(VisitController.name);
  constructor(@Inject('MIXPANEL_TOKEN') private readonly analytics: Mixpanel) {}

  @Post()
  async visit(@Analytics() analytics: IRequestAnalytics) {
    try {
      this.analytics.track('Visited', analytics);
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }
  }

  @Post('first')
  async firstVisit(@Analytics() analytics: IRequestAnalytics) {
    try {
      this.analytics.track('First Visit', analytics);
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }
  }
}
