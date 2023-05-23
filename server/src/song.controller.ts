import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Logger,
} from '@nestjs/common';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { EmailService } from './email/email.service';
import { PrismaService } from './prisma.service';

class StartReviewDto {
  @IsEmail()
  @IsOptional()
  email: string;
}

class SubmitReviewDto {
  @IsInt()
  reviewId: number;

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
  id: number;
  createdAt: Date;
  link: string;
  email: string;
  review: IReview[];
}

interface IReview {
  id: number;
  completedAt: Date | null;
  text: string | null;
  email: string | null;
}

interface ISongIncompleteReview {
  id: number;
  link: string;
  review: {
    id: number;
    text: null;
  };
}

@Controller('song')
export class SongController {
  private readonly logger = new Logger(SongController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  @Get('id/:id')
  async getSong(@Param('id', ParseIntPipe) id: number): Promise<ISong> {
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

    return {
      id: song.id,
      email: song.email,
      link: song.link,
      createdAt: song.createdAt,
      review: song.review,
    };
  }

  @Post('/start-review')
  async startReview(
    @Body() { email }: StartReviewDto,
  ): Promise<ISongIncompleteReview> {
    const queryResult = await this.prisma.$queryRaw<
      { songId: number; link: string; reviewId: number; text: null }[]
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
            "Review" ("songId", "email")
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
      throw new NotFoundException(
        'No songs available to review at the moment :(',
      );
    }

    const { songId, link, reviewId, text } = queryResult[0];

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
  ): Promise<Omit<IReview, 'email'>> {
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
    await this.email.notifyOfReviewCompleted({
      email: review.song.email,
      songId: review.song.id,
    });
    this.logger.log(
      `Emailing ${review.song.email} regarding ${review.song.id}`,
    );

    return {
      id: review.id,
      completedAt: review.completedAt,
      text: review.text,
    };
  }

  @Post('/submit-song')
  async submitSong(@Body() payload: RequestReviewDto): Promise<void> {
    const { link, email } = payload;
    await this.prisma.song.create({
      data: {
        link,
        email,
      },
    });
  }
}
