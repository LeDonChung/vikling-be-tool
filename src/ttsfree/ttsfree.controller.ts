import { Controller, Post, Body } from '@nestjs/common';
import type { Response } from 'express';
import { TtsfreeService } from './ttsfree.service';
import { CreateTtsfreeDto } from './dto/create-ttsfree.dto';

@Controller('ttsfree')
export class TtsfreeController {
  constructor(private readonly ttsfreeService: TtsfreeService) {}
  @Post()
  async textToSpeech(@Body() createTtsfreeDto: CreateTtsfreeDto) {
    return this.ttsfreeService.create(createTtsfreeDto);
  }
}
