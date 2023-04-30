import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { Song as PrismaSong, Review as PrismaReview } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
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
  text: string;

  @IsBoolean()
  liked: boolean;
}

class RequestReviewDto {
  @IsString()
  link: string;

  @IsEmail()
  email: string;
}

interface ISong {
  id: number;
  createdAt: Date;
  link: string;
  email: string;
  review: IReview | null;
}

interface IReview {
  id: number;
  completedAt: Date | null;
  text: string | null;
  liked: boolean | null;
  email: string | null;
}

@Controller('song')
export class SongController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('id/:id')
  async getSong(@Param('id', ParseIntPipe) id: number): Promise<ISong> {
    const song = await this.prisma.song.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!song) {
      throw new NotFoundException();
    }

    return {
      id: song.id,
      email: song.email,
      link: song.link,
      createdAt: song.createdAt,
      review: song.review
        ? {
            id: song.review.id,
            completedAt: song.review.completedAt,
            text: song.review.text,
            liked: song.review.liked,
            email: song.review.email,
          }
        : null,
    };
  }

  @Post('/start-review')
  async startReview(@Body() { email }: StartReviewDto): Promise<ISong> {
    // TODO would like to retry here 3 times
    // that way in the case of a race condition of someone stealing a song
    // a song will still be fetched (not scalable)
    const queryResult = await this.prisma.$queryRaw<{ id: number }[]>`
        WITH "toReviewSong" AS (
          SELECT "Song"."id"
          FROM "Song" 
          LEFT JOIN "Review" ON "Review"."songId" = "Song"."id"
          WHERE "Review"."id" IS NULL
            AND "Song"."email" != ${email ?? ''}
          ORDER BY "Song"."createdAt" ASC
          LIMIT 1
        ), "inserted" AS (
          INSERT INTO "Review" ("songId", "email")
          SELECT "toReviewSong"."id", ${email}
          FROM "toReviewSong" 
          WHERE "toReviewSong"."id" IS NOT NULL
        )
        SELECT 
          "toReviewSong"."id"
        FROM "toReviewSong";
      `;

    if (queryResult.length === 0) {
      throw new NotFoundException(
        'No songs available to review at the moment :(',
      );
    }

    const { id } = queryResult[0];

    const song = await this.prisma.song.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!song || !song.review) {
      throw new InternalServerErrorException();
    }

    return {
      id: song.id,
      email: song.email,
      link: song.link,
      createdAt: song.createdAt,
      review: song.review
        ? {
            id: song.review.id,
            completedAt: song.review.completedAt,
            text: song.review.text,
            liked: song.review.liked,
            email: song.review.email,
          }
        : null,
    };
  }

  @Post('/submit-review')
  async submitReview(@Body() payload: SubmitReviewDto): Promise<IReview> {
    const { text, liked, reviewId } = payload;

    // This should only be update-able by the person that "owns" the review
    const review = await this.prisma.review.update({
      data: {
        text,
        liked,
      },
      where: {
        id: reviewId,
      },
    });

    // TODO triggers email notification to song poster
    return {
      id: review.id,
      completedAt: review.completedAt,
      text: review.text,
      liked: review.liked,
      email: review.email,
    };
  }

  @Post('/request-review')
  async requestReview(@Body() payload: RequestReviewDto): Promise<void> {
    const { link, email } = payload;
    await this.prisma.song.create({
      data: {
        link,
        email,
      },
    });
  }
}

// TODO a cron that runs every minute and deletes abandoned reviews
// and moves them to abandoned reviews table
