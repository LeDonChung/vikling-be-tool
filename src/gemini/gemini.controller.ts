import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { GeminiService } from './gemini.service';
import { TextToSpeechDto } from './dto/text-to-speech.dto';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('tts')
  async textToSpeech(
    @Body() dto: TextToSpeechDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const audioBuffer = await this.geminiService.textToSpeech(dto);

      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length,
        'Content-Disposition': 'attachment; filename="output.wav"',
      });
      res.status(HttpStatus.OK).send(audioBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: 'Text-to-Speech Failed',
      });
    }
  }
}
