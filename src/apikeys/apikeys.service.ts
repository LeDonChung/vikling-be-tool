import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ApiKeyProvider } from './dto/apikeys.dto';

const REDIS_KEY_PREFIX = 'apikeys';

@Injectable()
export class ApiKeysService implements OnModuleDestroy {
  private readonly logger = new Logger(ApiKeysService.name);
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

  /**
   * Tạo Redis key theo provider
   */
  private getRedisKey(provider: ApiKeyProvider): string {
    return `${REDIS_KEY_PREFIX}:${provider}`;
  }

  /**
   * Import nhiều API keys vào Redis
   */
  async importKeys(provider: ApiKeyProvider, keys: string[]): Promise<number> {
    const cleanKeys = keys
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    if (cleanKeys.length === 0) {
      this.logger.warn(`No valid keys found for provider: ${provider}`);
      return 0;
    }

    const redisKey = this.getRedisKey(provider);
    
    // Lấy keys hiện có để tránh duplicate
    const existingKeys = await this.redis.lrange(redisKey, 0, -1);
    const existingSet = new Set(existingKeys);
    
    // Lọc keys mới
    const newKeys = cleanKeys.filter((key) => !existingSet.has(key));

    if (newKeys.length === 0) {
      this.logger.warn(`All keys already exist for provider: ${provider}`);
      return 0;
    }

    await this.redis.rpush(redisKey, ...newKeys);
    this.logger.log(
      `Imported ${newKeys.length} keys for provider: ${provider} (${cleanKeys.length - newKeys.length} duplicates skipped)`,
    );

    return newKeys.length;
  }

  /**
   * Import từ file content
   */
  async importKeysFromContent(
    provider: ApiKeyProvider,
    fileContent: string,
  ): Promise<number> {
    const keys = fileContent.split('\n');
    return this.importKeys(provider, keys);
  }

  /**
   * Lấy tất cả keys của provider
   */
  async listKeys(provider: ApiKeyProvider): Promise<string[]> {
    const redisKey = this.getRedisKey(provider);
    return this.redis.lrange(redisKey, 0, -1);
  }

  /**
   * Lấy random keys từ provider
   */
  async getRandomKeys(provider: ApiKeyProvider, count: number = 10): Promise<string[]> {
    const allKeys = await this.listKeys(provider);

    if (allKeys.length <= count) {
      return allKeys;
    }

    // Shuffle và lấy random keys
    const shuffled = [...allKeys].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Xóa một key cụ thể
   */
  async deleteKey(provider: ApiKeyProvider, key: string): Promise<boolean> {
    const redisKey = this.getRedisKey(provider);
    const removed = await this.redis.lrem(redisKey, 0, key);
    
    if (removed > 0) {
      this.logger.log(`Deleted key from provider ${provider}`);
      return true;
    }
    return false;
  }

  /**
   * Xóa tất cả keys của provider
   */
  async deleteAllKeys(provider: ApiKeyProvider): Promise<number> {
    const redisKey = this.getRedisKey(provider);
    const count = await this.redis.llen(redisKey);
    await this.redis.del(redisKey);
    
    this.logger.log(`Deleted all ${count} keys for provider: ${provider}`);
    return count;
  }

  /**
   * Đếm số keys của provider
   */
  async countKeys(provider: ApiKeyProvider): Promise<number> {
    const redisKey = this.getRedisKey(provider);
    return this.redis.llen(redisKey);
  }

  /**
   * Lấy thống kê tất cả providers
   */
  async getStats(): Promise<Record<ApiKeyProvider, number>> {
    const providers: ApiKeyProvider[] = ['gemini', 'chatgpt', 'elevenlabs'];
    const stats: Record<string, number> = {};

    for (const provider of providers) {
      stats[provider] = await this.countKeys(provider);
    }

    return stats as Record<ApiKeyProvider, number>;
  }
}
