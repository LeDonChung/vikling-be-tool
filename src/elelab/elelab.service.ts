import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const DEFAULT_KEY_NAME = 'elelab:keys';

@Injectable()
export class ElabService implements OnModuleDestroy {
  private readonly logger = new Logger(ElabService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password'),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async importKeysFromContent(
    fileContent: string,
    keyName: string = DEFAULT_KEY_NAME,
  ): Promise<number> {
    const keys = fileContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (keys.length === 0) {
      this.logger.warn('No keys found in file content');
      return 0;
    }

    await this.redis.rpush(keyName, ...keys);
    this.logger.log(`Imported ${keys.length} keys to Redis key: ${keyName}`);

    return keys.length;
  }

  async listAllElabKeys(count: number = 100): Promise<string[]> {
    const allKeys = await this.redis.lrange(DEFAULT_KEY_NAME, 0, -1);
    
    if (allKeys.length <= count) {
      return allKeys;
    }

    // Shuffle và lấy random keys
    const shuffled = [...allKeys].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
