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
import { IsInt } from 'class-validator';
import { PrismaService } from './prisma.service';

class StartReviewDto {
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
  async submitReview(review: any): Promise<Song> {
    // do not allow duplicate submissions
    // triggers email notification to song poster
    return '' as any;
  }

  @Post('/request-review')
  async requestReview(@Body() payload: any): Promise<Song> {
    return await this.prisma.song.create({
      data: {
        link: '',
      } as any,
    });
  }
}

// TODO a cron that runs every minute and deletes expired reviews
