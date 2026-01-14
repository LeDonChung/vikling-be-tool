import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslateTextDto } from './dto/translate-text.dto';

@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('translate')
  async translate(@Body() dto: TranslateTextDto) {
    try {
      return await this.translationService.translate(dto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Translation failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
