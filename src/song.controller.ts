import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { Song } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Controller('song')
export class SongController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/:id')
  async getSong(@Param('id', ParseIntPipe) id: number): Promise<Song> {
    // this should also join on review
    const song = await this.prisma.song.findUnique({ where: { id } });

    if (!song) {
      throw new NotFoundException();
    }

    return song;
  }

  @Post('/start-review')
  async startReview(): Promise<Song> {
    const userId = 1;

    const songs = await this.prisma.$queryRaw<Song[]>`
        WITH "toReviewSong" AS (
          SELECT "Song"."id", "Song"."link", "Song"."updatedAt", "Song"."createdAt", "Song"."userId"
          FROM "Song" 
          LEFT join "Review" ON "Review"."songId" = "Song"."id"
          WHERE "Review"."id" IS null
            AND "Song"."userId" != ${userId}
          ORDER BY "Song"."createdAt" ASC
          LIMIT 1
        ), "inserted" AS (
          INSERT INTO "Review" ("songId", "userId")
          SELECT "Song"."id", "Song"."userId"
          FROM "Song" 
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
