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
  async reviewSong(@Param('id', ParseIntPipe) id: number): Promise<Song> {
    const song = await this.prisma.song.findUnique({ where: { id } });

    if (!song) {
      throw new NotFoundException();
    }

    return song;
  }

  // submit review

  @Post('request')
  async requestReview(@Body() payload: any): Promise<Song> {
    return await this.prisma.song.create({
      data: {
        link: '',
      },
    });
  }
}
