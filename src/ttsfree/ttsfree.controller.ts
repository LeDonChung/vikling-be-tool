import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  Res,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { TtsfreeService } from './ttsfree.service';
import { CreateTtsfreeDto } from './dto/create-ttsfree.dto';
import { UpdateTtsfreeDto } from './dto/update-ttsfree.dto';
import * as fs from 'fs';
import * as path from 'path';

@Controller('ttsfree')
export class TtsfreeController {
  constructor(private readonly ttsfreeService: TtsfreeService) {}

  /**
   * Generate TTS audio from text
   * POST /ttsfree
   * Body: { text, language, voice, voiceSpeed, speechPitch }
   */
  @Post()
  create(@Body() createTtsfreeDto: CreateTtsfreeDto) {
    return this.ttsfreeService.create(createTtsfreeDto);
  }

  /**
   * Get all generated audio files
   * GET /ttsfree
   */
  @Get()
  findAll() {
    return this.ttsfreeService.findAll();
  }

  /**
   * Download a specific audio file
   * GET /ttsfree/download/:filename
   */
  @Get('download/:filename')
  async downloadFile(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const filepath = path.join(process.cwd(), 'uploads', filename);
    
    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Audio file not found');
    }

    const file = fs.createReadStream(filepath);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ttsfreeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTtsfreeDto: UpdateTtsfreeDto) {
    return this.ttsfreeService.update(+id, updateTtsfreeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ttsfreeService.remove(+id);
  }
}
