import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { Song, Review } from '@prisma/client';
import { IsBoolean, IsInt, IsString } from 'class-validator';
import { PrismaService } from './prisma.service';

class StartReviewDto {
  @IsInt()
  userId: number;
}

class SubmitReviewDto {
  @IsInt()
  songId: number;

  @IsString()
  text: string;

  @IsBoolean()
  liked: boolean;
}

class RequestReviewDto {
  @IsString()
  link: string;

  @IsInt()
  userId: number;
}

@Controller('song')
export class SongController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('id/:id')
  async getSong(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Song & { review: Review | null }> {
    const song = await this.prisma.song.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!song) {
      throw new NotFoundException();
    }

    return song;
  }

  @Post('/start-review')
  async startReview(@Body() { userId }: StartReviewDto): Promise<Song> {
    // TODO would like to retry here 3 times
    // that way in the case of a race condition of someone stealing a song
    // a song will still be fetched (not scalable)
    const songs = await this.prisma.$queryRaw<Song[]>`
        WITH "toReviewSong" AS (
          SELECT "Song"."id", "Song"."link", "Song"."updatedAt", "Song"."createdAt", "Song"."userId"
          FROM "Song" 
          LEFT JOIN "Review" ON "Review"."songId" = "Song"."id"
          WHERE "Review"."id" IS NULL
            AND "Song"."userId" != ${userId}
          ORDER BY "Song"."createdAt" ASC
          LIMIT 1
        ), "inserted" AS (
          INSERT INTO "Review" ("songId", "userId")
          SELECT "toReviewSong"."id", ${userId}
          FROM "toReviewSong" 
          WHERE "toReviewSong"."id" IS NOT NULL
        )
        SELECT *
        FROM "toReviewSong";
      `;

    if (songs.length === 0) {
      throw new NotFoundException(
        'No songs available to review at the moment :(',
      );
    }

    return songs[0];
  }

  @Post('/submit-review')
  async submitReview(@Body() payload: SubmitReviewDto): Promise<Review> {
    const { text, liked, songId } = payload;

    // This should only be update-able by the person that "owns" the review
    const review = await this.prisma.review.update({
      data: {
        text,
        liked,
      },
      where: {
        songId,
      },
    });

    // TODO triggers email notification to song poster
    return review;
  }

  @Post('/request-review')
  async requestReview(@Body() payload: RequestReviewDto): Promise<Song> {
    const { userId, link } = payload;
    return await this.prisma.song.create({
      data: {
        link,
        userId,
      },
    });
  }
}

// TODO a cron that runs every minute and deletes abandoned reviews
// and moves them to abandoned reviews table
