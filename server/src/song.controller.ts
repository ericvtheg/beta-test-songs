import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Logger,
  ParseUUIDPipe,
  Inject,
  Query,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { EmailService } from './email/email.service';
import { PrismaService } from './prisma.service';
import { Mixpanel } from 'mixpanel';

class StartReviewDto {
  @IsEmail()
  @IsOptional()
  email: string;
}

class SubmitReviewDto {
  @IsUUID()
  reviewId: string;

  @IsString()
  @MaxLength(10000)
  text: string;
}

class RequestReviewDto {
  @Matches(
    new RegExp(
      '^(https?://)?([\\w-]+\\.)?soundcloud\\.com/[\\w-]+(/[\\w-]+)*(/?)?(\\?.*)?(#.*)?$',
      'i',
    ),
    { message: 'Please enter a valid SoundCloud URL' },
  )
  @MaxLength(300)
  link: string;

  @IsEmail()
  @MaxLength(300)
  email: string;
}

interface ISong {
  id: string;
  createdAt: Date;
  link: string;
  email: string;
  review?: IReview;
}

interface IReview {
  id: string;
  completedAt: Date | null;
  text: string | null;
}

interface ISongIncompleteReview {
  id: string;
  link: string;
  review: {
    id: string;
    text: null;
  };
}

@Controller('song')
export class SongController {
  private readonly logger = new Logger(SongController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    @Inject('MIXPANEL_TOKEN') private readonly analytics: Mixpanel,
  ) {}

  @Get('id/:id')
  async getSong(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('origin') origin: string,
    @Ip() ip: string,
    @Headers('BtsUuid') analyticsId: string,
  ): Promise<ISong> {
    const song = await this.prisma.song.findUnique({
      where: { id },
      include: {
        review: {
          orderBy: {
            completedAt: 'desc',
          },
          where: {
            NOT: { completedAt: null },
          },
          take: 1,
        },
      },
    });

    if (!song) {
      throw new NotFoundException();
    }

    try {
      this.analytics.track('Fetched Song', {
        songId: id,
        origin: origin ?? 'direct',
        ip,
        distinct_id: analyticsId,
      });
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }

    return {
      id: song.id,
      email: song.email,
      link: song.link,
      createdAt: song.createdAt,
      review:
        song.review.length === 0
          ? undefined
          : {
              id: song.review?.[0]?.id,
              completedAt: song.review?.[0]?.completedAt,
              text: song.review?.[0]?.text,
            },
    };
  }

  @Post('/start-review')
  async startReview(
    @Body() { email }: StartReviewDto,
    @Ip() ip: string,
    @Headers('BtsUuid') analyticsId: string,
  ): Promise<ISongIncompleteReview> {
    const queryResult = await this.prisma.$queryRaw<
      { songId: string; link: string; reviewId: string; text: null }[]
    >`
        WITH "toReviewSong" AS (
          SELECT
            "Song"."id", "Song"."link"
          FROM
            "Song"
            LEFT JOIN "Review" ON "Review"."songId" = "Song"."id"
          WHERE
            (
              "Review"."id" IS NULL
              OR (
                now() :: timestamp - (
                  SELECT
                    MAX("Review"."createdAt")
                  FROM
                    "Review"
                  WHERE
                    "Review"."songId" = "Song"."id"
                    AND "Review"."completedAt" IS NULL
                ) > interval '1 hour'
              )
            )
            AND "Song"."email" != ${email ?? ''}
          ORDER BY
            "Song"."createdAt" ASC
          LIMIT
            1
        ), "inserted" AS (
          INSERT INTO
            "Review" ("songId", "reviewerEmail")
          SELECT
            "toReviewSong"."id", ${email}
          FROM
            "toReviewSong"
          WHERE
            "toReviewSong"."id" IS NOT NULL
          RETURNING "id", "text"
        )
        SELECT
          "toReviewSong"."id" as "songId", "toReviewSong"."link" as "link", 
            "inserted"."id" as "reviewId", "inserted"."text" as "text"
        FROM
          "toReviewSong", "inserted";
      `;

    if (queryResult.length === 0) {
      try {
        this.analytics.track('No Songs Available for Review', {
          ip,
          distinct_id: analyticsId,
        });
      } catch (err) {
        this.logger.error('Failed to push event to mixpanel', err);
      }
      throw new NotFoundException(
        'No songs available to review at the moment :(',
      );
    }

    const { songId, link, reviewId, text } = queryResult[0];

    try {
      this.analytics.track('Review Started', {
        songId,
        link,
        ip,
        distinct_id: analyticsId,
      });
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }

    return {
      id: songId,
      link,
      review: {
        id: reviewId,
        text,
      },
    };
  }

  @Post('/submit-review')
  async submitReview(
    @Body() payload: SubmitReviewDto,
    @Ip() ip: string,
    @Headers('BtsUuid') analyticsId: string,
  ): Promise<IReview> {
    const { text, reviewId } = payload;

    // This isn't great. I think it'd be solved by having user accounts
    // Theoretically someone can abandon a review then update it later while someone else is working on it
    // This can also currently be updated multiple times
    const review = await this.prisma.review.update({
      data: {
        text,
        completedAt: new Date(),
      },
      where: {
        id: reviewId,
      },
      include: {
        song: true,
      },
    });

    // triggers email notification to song poster
    if (!review.songCreatorEmailedAt) {
      try {
        await this.email.notifyOfReviewCompleted({
          email: review.song.email,
          songId: review.song.id,
        });
        this.logger.log(
          `Emailed ${review.song.email} regarding ${review.song.id}`,
        );

        await this.prisma.review.update({
          data: {
            songCreatorEmailedAt: new Date(),
          },
          where: {
            id: reviewId,
          },
        });
      } catch (err) {
        this.logger.error(
          `Failed to email ${review.song.email} and update db of submitted review for song ${review.song.id}`,
          err,
        );
      }
    }

    try {
      this.analytics.track('Review Submitted', {
        songId: review.song.id,
        text,
        ip,
        distinct_id: analyticsId,
      });
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }

    return {
      id: review.id,
      completedAt: review.completedAt,
      text: review.text,
    };
  }

  @Post('/submit-song')
  async submitSong(
    @Body() payload: RequestReviewDto,
    @Ip() ip: string,
    @Headers('BtsUuid') analyticsId: string,
  ): Promise<void> {
    const { link, email } = payload;
    const song = await this.prisma.song.create({
      data: {
        link,
        email,
      },
    });

    try {
      this.analytics.track('Song Submitted', {
        songId: song.id,
        link,
        email,
        ip,
        distinct_id: analyticsId,
      });
    } catch (err) {
      this.logger.error('Failed to push event to mixpanel', err);
    }
  }
}
