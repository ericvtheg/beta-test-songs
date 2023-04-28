import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SongController } from './song.controller';

@Module({
  imports: [],
  controllers: [SongController],
  providers: [PrismaService],
})
export class AppModule {}
