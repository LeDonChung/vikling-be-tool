import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GrokService } from './grok.service';
import { CreateGrokDto } from './dto/create-grok.dto';
import { UpdateGrokDto } from './dto/update-grok.dto';

@Controller('grok')
export class GrokController {
  constructor(private readonly grokService: GrokService) {}

  @Post()
  create(@Body() createGrokDto: CreateGrokDto) {
    return this.grokService.create(createGrokDto);
  }

  @Get()
  findAll() {
    return this.grokService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grokService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGrokDto: UpdateGrokDto) {
    return this.grokService.update(+id, updateGrokDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.grokService.remove(+id);
  }
}
