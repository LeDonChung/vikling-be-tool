import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { TextToSpeechDto } from './dto/text-to-speech.dto';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKeys: string[];
  private readonly defaultModel: string;
  private currentKeyIndex = 0;

  constructor(private configService: ConfigService) {
    this.apiKeys = this.configService.get<string[]>('gemini.apiKeys') || [];
    this.defaultModel =
      this.configService.get<string>('gemini.defaultModel') ||
      'gemini-2.5-flash-preview-tts';

    if (this.apiKeys.length === 0) {
      this.logger.warn('No GEMINI_API_KEYS configured');
    } else {
      this.logger.log(`Loaded ${this.apiKeys.length} Gemini API key(s)`);
    }
  }

  /** TTS with automatic key rotation. Returns WAV buffer (24kHz, 16-bit, mono) */
  async textToSpeech(dto: TextToSpeechDto): Promise<Buffer> {
    if (this.apiKeys.length === 0) {
      throw new Error('No Gemini API keys configured');
    }

    const maxRetries = this.apiKeys.length;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const keyIndex = (this.currentKeyIndex + attempt) % this.apiKeys.length;

      try {
        const audioBuffer = await this.generateTTS(this.apiKeys[keyIndex], dto);
        this.currentKeyIndex = keyIndex;
        return audioBuffer;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `TTS failed (key ${keyIndex}, attempt ${attempt + 1}/${maxRetries}): ${lastError.message}`,
        );

        if (!this.isRetryableError(lastError)) throw lastError;

        if (attempt < maxRetries - 1) {
          const delay =
            Math.min(1000 * Math.pow(2, attempt), 5000) + Math.random() * 500;
          await new Promise((r) => setTimeout(r, delay));
        }
        this.currentKeyIndex = (keyIndex + 1) % this.apiKeys.length;
      }
    }

    throw new Error(
      `All API keys exhausted. Last error: ${lastError?.message}`,
    );
  }

  private async generateTTS(
    apiKey: string,
    dto: TextToSpeechDto,
  ): Promise<Buffer> {
    const ai = new GoogleGenAI({ apiKey });

    const config: Record<string, unknown> = {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: dto.voiceName || 'Kore' },
        },
        languageCode: dto.languageCode || 'vi-VN',
      },
    };

    if (dto.temperature !== undefined) config.temperature = dto.temperature;

    const request: Record<string, unknown> = {
      model: dto.model || this.defaultModel,
      contents: [{ parts: [{ text: dto.text }] }],
      config,
    };

    if (dto.styleInstructions) {
      request.systemInstruction = { parts: [{ text: dto.styleInstructions }] };
    }

    const response = await ai.models.generateContent(
      request as unknown as Parameters<typeof ai.models.generateContent>[0],
    );

    const audioData =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error('No audio data in response');

    return this.createWavBuffer(Buffer.from(audioData, 'base64'));
  }

  private createWavBuffer(
    pcm: Buffer,
    rate = 24000,
    ch = 1,
    bits = 16,
  ): Buffer {
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(pcm.length + 36, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(ch, 22);
    header.writeUInt32LE(rate, 24);
    header.writeUInt32LE((rate * ch * bits) / 8, 28);
    header.writeUInt16LE((ch * bits) / 8, 32);
    header.writeUInt16LE(bits, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
  }

  private isRetryableError(error: Error): boolean {
    const msg = error.message.toLowerCase();
    return [
      'rate limit',
      'quota',
      'api key',
      '429',
      '500',
      '502',
      '503',
      '504',
    ].some((p) => msg.includes(p));
  }
}
