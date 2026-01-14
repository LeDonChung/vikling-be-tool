import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { TranslateTextDto } from './dto/translate-text.dto';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  // MyMemory API - Hoàn toàn miễn phí, không cần API key
  // Limit: 10,000 words/day per IP
  private readonly apiUrl = 'https://api.mymemory.translated.net/get';

  async translate(dto: TranslateTextDto) {
    const { text, source = 'en', target = 'vi' } = dto;

    try {
      const detectedSource = source;

      // Build query params
      const params = new URLSearchParams({
        q: text,
        langpair: `${detectedSource}|${target}`,
      });

      const response = await fetch(`${this.apiUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new HttpException(
          'Translation service error',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();

      if (data.responseStatus !== 200) {
        throw new HttpException(
          data.responseDetails || 'Translation failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const translatedText = data.responseData.translatedText;

      this.logger.log(`Translation completed: ${text.length} chars`);

      return {
        success: true,
        data: {
          originalText: text,
          translatedText: translatedText,
          sourceLanguage: detectedSource,
          targetLanguage: target,
          detectedLanguage: detectedSource,
        },
      };
    } catch (error) {
      this.logger.error('Translation failed:', error);
      throw new HttpException(
        error.message || 'Failed to translate text',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
