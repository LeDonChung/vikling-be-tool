import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SttService } from './stt.service';
import { TranscribeAudioDto } from './dto/transcribe-audio.dto';

@Controller('stt')
export class SttController {
  constructor(private readonly sttService: SttService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: TranscribeAudioDto,
  ) {
    if (!file) {
      throw new HttpException('Audio file is required', HttpStatus.BAD_REQUEST);
    }

    // Validate file type
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/ogg',
      'audio/webm',
      'video/mp4',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new HttpException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.sttService.transcribe(file, dto);
  }

  @Get('download-model')
  async downloadModel(@Query('model') model: string) {
    if (!model) {
      throw new HttpException('Model name is required', HttpStatus.BAD_REQUEST);
    }

    const allowedModels = ['tiny', 'base', 'small', 'medium', 'large'];
    if (!allowedModels.includes(model)) {
      throw new HttpException(
        `Invalid model. Allowed: ${allowedModels.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.sttService.downloadModel(model);
    return {
      success: true,
      message: result,
    };
  }

  @Get('info')
  getInfo() {
    return {
      success: true,
      info: {
        models: ['tiny', 'base', 'small', 'medium', 'large'],
        languages: ['vi', 'en', 'auto'],
        supportedFormats: ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'mp4'],
        recommendations: {
          vietnamese: 'Use model "small" or "medium" for Vietnamese',
          english: 'Use model "base" or "small" for English',
        },
      },
    };
  }
}
