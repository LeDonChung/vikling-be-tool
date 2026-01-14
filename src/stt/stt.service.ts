import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { TranscribeAudioDto } from './dto/transcribe-audio.dto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as ffmpegPath from '@ffmpeg-installer/ffmpeg';

const execAsync = promisify(exec);

@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly modelsDir = path.join(process.cwd(), 'whisper-models');
  private readonly whisperPath = path.join(
    process.cwd(),
    'node_modules',
    'whisper-node',
    'lib',
    'whisper.cpp',
  );

  constructor() {
    // Ensure directories exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  async transcribe(file: Express.Multer.File, dto: TranscribeAudioDto) {
    const startTime = Date.now();
    let tempWavPath: string | null = null;

    try {
      this.logger.log('Starting audio transcription...');

      const { model = 'small', language = 'vi', translate = 'false' } = dto;

      // Save uploaded file
      const originalPath = path.join(this.uploadDir, file.originalname);
      fs.writeFileSync(originalPath, file.buffer);

      // Convert to WAV 16kHz mono (required by whisper)
      tempWavPath = path.join(
        this.uploadDir,
        `temp_${Date.now()}_${file.originalname}.wav`,
      );

      this.logger.log('Converting audio to WAV format...');
      await this.convertToWav(originalPath, tempWavPath);

      // Check if model exists
      const modelPath = path.join(this.modelsDir, `ggml-${model}.bin`);

      if (!fs.existsSync(modelPath)) {
        throw new HttpException(
          `Model '${model}' not found. Please download it first using: npx whisper-node download --model ${model}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Transcribe using whisper-node
      this.logger.log(
        `Transcribing with model: ${model}, language: ${language}...`,
      );

      // Use whisper.cpp directly
      const whisperCommand = this.buildWhisperCommand(
        modelPath,
        tempWavPath,
        language,
        translate === 'true',
      );

      this.logger.log(`Running: ${whisperCommand}`);
      const { stdout } = await execAsync(whisperCommand, {
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      // Parse output
      const transcription = this.parseWhisperOutput(stdout);

      // Cleanup
      this.cleanup([originalPath, tempWavPath]);

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

      this.logger.log(`Transcription completed in ${processingTime}s`);

      return {
        success: true,
        data: {
          text: transcription,
          model,
          language,
          duration: file.size,
          processingTime: `${processingTime}s`,
        },
      };
    } catch (error: any) {
      this.logger.error('Transcription failed:', error);

      // Cleanup on error
      if (tempWavPath && fs.existsSync(tempWavPath)) {
        fs.unlinkSync(tempWavPath);
      }

      throw new HttpException(
        error.message || 'Failed to transcribe audio',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async convertToWav(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    const ffmpeg = ffmpegPath.path;
    const command = `"${ffmpeg}" -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y`;

    try {
      await execAsync(command);
    } catch (error: any) {
      this.logger.error('ConvertToWav failed:', error);

      throw new HttpException(
        'Failed to convert audio format',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildWhisperCommand(
    modelPath: string,
    audioPath: string,
    language: string,
    translate: boolean,
  ): string {
    // Detect OS and check for whisper binary
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';

    const possiblePaths = [
      // Primary locations (setup script puts binary here)
      path.join(process.cwd(), 'whisper-bin', isWindows ? 'main.exe' : 'main'),
      // Fallback to node_modules
      path.join(
        process.cwd(),
        'node_modules',
        'whisper-node',
        'lib',
        'whisper.cpp',
        isWindows ? 'main.exe' : 'main',
      ),
      // Fallback to source build directory
      path.join(process.cwd(), 'whisper.cpp', isWindows ? 'main.exe' : 'main'),
    ];

    let whisperExe = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        whisperExe = p;
        this.logger.log(`Found whisper binary at: ${p}`);
        break;
      }
    }

    if (!whisperExe) {
      const setupCommand = isWindows
        ? 'powershell -ExecutionPolicy Bypass -File setup-whisper-windows.ps1'
        : isMac
          ? 'bash setup-whisper-mac.sh'
          : 'Please compile whisper.cpp manually';

      throw new HttpException(
        `Whisper binary not found. Please run setup script: ${setupCommand}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    let command = `"${whisperExe}" -m "${modelPath}" -f "${audioPath}"`;

    // Language detection
    if (language && language !== 'auto') {
      command += ` -l ${language}`;
    }
    // If language is 'auto' or not specified, let Whisper auto-detect

    if (translate) {
      command += ' --translate';
    }

    // Output options - output to txt file for easier parsing
    command += ' --no-timestamps --output-txt';

    return command;
  }

  private parseWhisperOutput(output: string): string {
    // Whisper outputs the transcription to stdout
    // Filter out debug/progress lines and keep only the transcription
    const lines = output.split('\n');

    const transcriptionLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;

      // Skip lines with whisper metadata/progress
      if (trimmed.startsWith('[')) return false;
      if (trimmed.includes('whisper_')) return false;
      if (trimmed.includes('system_info')) return false;
      if (trimmed.includes('processing')) return false;
      if (trimmed.includes('load time')) return false;
      if (trimmed.includes('mel time')) return false;
      if (trimmed.includes('sample time')) return false;
      if (trimmed.includes('encode time')) return false;
      if (trimmed.includes('decode time')) return false;
      if (trimmed.includes('total time')) return false;
      if (trimmed.match(/^\d+$/)) return false;

      return true;
    });

    const result = transcriptionLines.join(' ').trim();
    this.logger.log(
      `Parsed transcription (${result.length} chars): ${result.substring(0, 100)}...`,
    );
    return result;
  }

  private cleanup(files: string[]): void {
    files.forEach((file) => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (error: any) {
          this.logger.warn(`Failed to delete file: ${file} - ${error.message}`);
        }
      }
    });
  }

  async downloadModel(model: string): Promise<string> {
    try {
      this.logger.log(`Downloading model: ${model}...`);

      const command = `npx whisper-node download --model ${model}`;
      await execAsync(command);

      return `Model ${model} downloaded successfully`;
    } catch (error) {
      throw new HttpException(
        `Failed to download model: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
