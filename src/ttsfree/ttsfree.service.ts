import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CreateTtsfreeDto } from './dto/create-ttsfree.dto';
import { UpdateTtsfreeDto } from './dto/update-ttsfree.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as puppeteer from 'puppeteer';

@Injectable()
export class TtsfreeService {
  private readonly logger = new Logger(TtsfreeService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(createTtsfreeDto: CreateTtsfreeDto) {
    let browser: puppeteer.Browser | undefined;
    
    try {
      this.logger.log('Starting TTS conversion with Puppeteer...');
      
      const { 
        text, 
        language = 'vi-VN', 
        voice = 'vi-VN-HoaiMyNeural', 
        voiceSpeed = 0, 
        speechPitch = 0 
      } = createTtsfreeDto;

      // Launch browser
      this.logger.log('Launching browser...');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate to ttsfree.com
      this.logger.log('Navigating to ttsfree.com...');
      await page.goto('https://ttsfree.com', {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });

      // Wait for form to be ready
      await page.waitForSelector('#tts-text', { timeout: 10000 });
      await page.waitForSelector('#convert_now', { timeout: 10000 });

      // Fill in the text
      this.logger.log('Filling in text...');
      await page.type('#tts-text', text);

      // Select language (vi-VN for Vietnamese)
      this.logger.log('Selecting language...');
      await page.evaluate(() => {
        const langInput = document.querySelector('#select_lang') as HTMLInputElement;
        if (langInput) langInput.value = 'vi-VN';
      });

      // Select voice
      this.logger.log(`Selecting voice: ${voice}...`);
      await page.evaluate((voiceId) => {
        const voiceInput = document.querySelector('#voiceID') as HTMLInputElement;
        if (voiceInput) voiceInput.value = voiceId;
        
        // Click the voice radio button
        const voiceRadio = document.querySelector(`input[value="${voiceId}"]`) as HTMLInputElement;
        if (voiceRadio) voiceRadio.click();
      }, voice);

      // Set voice speed
      this.logger.log(`Setting voice speed: ${voiceSpeed}...`);
      await page.evaluate((speed) => {
        const rateSlider = document.querySelector('#rate-slider') as HTMLInputElement;
        const rateHidden = document.querySelector('#rate-hidden') as HTMLInputElement;
        if (rateSlider) {
          rateSlider.value = speed.toString();
          rateSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (rateHidden) rateHidden.value = speed.toString();
      }, voiceSpeed);

      // Set speech pitch
      this.logger.log(`Setting speech pitch: ${speechPitch}...`);
      await page.evaluate((pitch) => {
        const pitchSlider = document.querySelector('#pitch-slider') as HTMLInputElement;
        const pitchHidden = document.querySelector('#pitch-hidden') as HTMLInputElement;
        if (pitchSlider) {
          pitchSlider.value = pitch.toString();
          pitchSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (pitchHidden) pitchHidden.value = pitch.toString();
      }, speechPitch);

      // Wait a bit for everything to settle
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

      // Click convert button and wait for audio
      this.logger.log('Clicking convert button...');
      
      // Listen for download
      const downloadPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio download timeout after 2 minutes'));
        }, 120000); // 2 minutes timeout

        page.on('response', async (response) => {
          const url = response.url();
          
          // Check if this is an MP3 file
          if (url.includes('.mp3') || response.headers()['content-type']?.includes('audio')) {
            this.logger.log(`Found audio URL: ${url}`);
            clearTimeout(timeout);
            resolve(url);
          }
        });
      });

      await page.click('#convert_now');
      
      // Wait for audio URL
      const audioUrl = await downloadPromise;
      
      this.logger.log(`Downloading audio from: ${audioUrl}`);
      
      // Download the audio file
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new HttpException(
          'Failed to download audio file',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      
      // Generate unique filename
      const filename = `tts_${uuidv4()}.mp3`;
      const filepath = path.join(this.uploadDir, filename);
      
      // Save audio file
      fs.writeFileSync(filepath, audioBuffer);
      
      this.logger.log(`Audio saved to: ${filepath}`);

      return {
        success: true,
        message: 'TTS conversion completed successfully',
        data: {
          filename,
          filepath,
          size: audioBuffer.length,
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          voice,
          language,
        },
      };
    } catch (error) {
      this.logger.error('TTS conversion failed:', error);
      throw new HttpException(
        error.message || 'Failed to convert text to speech',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  findAll() {
    // List all generated audio files
    try {
      const files = fs.readdirSync(this.uploadDir);
      const audioFiles = files.filter(file => file.endsWith('.mp3'));
      
      return {
        success: true,
        count: audioFiles.length,
        files: audioFiles.map(file => {
          const filepath = path.join(this.uploadDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
          };
        }),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to list audio files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} ttsfree`;
  }

  update(id: number, updateTtsfreeDto: UpdateTtsfreeDto) {
    return `This action updates a #${id} ttsfree`;
  }

  remove(id: number) {
    return `This action removes a #${id} ttsfree`;
  }
}
