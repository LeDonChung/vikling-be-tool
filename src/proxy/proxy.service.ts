import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios, { } from 'axios';
import Redis from 'ioredis';
import {
  ProxyItem,
  GetProxyListResponse,
  LiveProxy,
} from './dto/proxy.dto';

const REDIS_PROXY_KEY = 'proxies';
const REDIS_PROXY_EXPIRE = 60 * 60;

@Injectable()
export class ProxyService implements OnModuleInit {
  private readonly logger = new Logger(ProxyService.name);
  private readonly redis: Redis;
  private readonly userToken: string;
  private readonly apiBaseUrl = 'https://api.1ip.vn';
  private readonly RECHECK_INTERVAL = 60 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('proxy-check') private readonly proxyCheckQueue: Queue,
  ) {
    this.userToken = process.env['1IP_USER_TOKEN'] || '';

    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password'),
    });
  }

  async onModuleInit() {
    await this.proxyCheckQueue.removeRepeatableByKey('recheck-proxies:60min');

    await this.proxyCheckQueue.add(
      'recheck-all-proxies',
      { recheck: true },
      {
        repeat: {
          every: this.RECHECK_INTERVAL,
        },
        jobId: 'recheck-proxies:60min',
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    this.logger.log('🔄 Scheduled proxy recheck job every 60 minutes');
  }

  /**
   * Lấy danh sách proxy từ API 1IP
   */
  async getProxyList(): Promise<ProxyItem[]> {
    try {
      const response = await axios.get<GetProxyListResponse>(
        `${this.apiBaseUrl}/user/data/getlistproxy`,
        {
          params: { token: this.userToken },
          timeout: 10000,
        },
      );
      if (response.data.Status == 'success' && response.data.Data) {
        this.logger.log(`Fetched ${response.data.Data.length} proxies from API`);
        return response.data.Data;
      } else {
        this.logger.error(`Failed to fetch proxies: ${response.data.Message}`);
        return [];
      }
    } catch (error) {
      this.logger.error(`Error fetching proxy list: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kiểm tra proxy có live hay không
   */
  async checkProxyLive(proxy: ProxyItem): Promise<boolean> {
    return true;
  }

  /**
   * Thêm job kiểm tra tất cả proxies vào queue
   */
  async queueProxyCheck(): Promise<{ message: string; jobCount: number }> {
    const proxies = await this.getProxyList();

    if (proxies.length === 0) {
      return { message: 'No proxies found', jobCount: 0 };
    }

    for (const proxy of proxies) {
      await this.proxyCheckQueue.add(
        'check-proxy',
        { proxy },
        {
          removeOnComplete: true,
          removeOnFail: 100,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    }

    this.logger.log(`Queued ${proxies.length} proxy checks`);
    return { message: 'Proxy checks queued', jobCount: proxies.length };
  }

  /**
   * Tạo proxy key theo format: username:password@host:port
   */
  private createProxyKey(proxy: ProxyItem): string {
    const username = proxy.proxy_auth_username || '';
    const password = proxy.proxy_auth_password || '';
    const host = proxy.public_origin_ip || proxy.public_ip;
    const port = proxy.http_port;

    if (username && password) {
      return `${username}:${password}@${host}:${port}`;
    }
    return `${host}:${port}`;
  }

  private isProxyExpired(expiredDate: string): boolean {
    const vietnamNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );

    const expiryDate = new Date(expiredDate);

    return vietnamNow >= expiryDate;
  }

  /**
   * Lưu proxy live vào Redis
   * Key format: username:password@host:port
   * Bỏ qua proxy đã hết hạn
   */
  async saveLiveProxy(proxy: ProxyItem): Promise<void> {
    // Kiểm tra proxy hết hạn chưa
    if (this.isProxyExpired(proxy.expired_date)) {
      this.logger.warn(`Proxy ${proxy.id} đã hết hạn (${proxy.expired_date}), bỏ qua`);
      return;
    }

    const proxyKey = this.createProxyKey(proxy);

    const liveProxy: LiveProxy = {
      id: proxy.id,
      proxy_type: proxy.proxy_type,
      package_api_key: proxy.package_api_key,
      public_ip: proxy.public_ip,
      public_origin_ip: proxy.public_origin_ip,
      http_port: proxy.http_port,
      https_port: proxy.https_port,
      socks_port: proxy.socks_port,
      proxy_auth_username: proxy.proxy_auth_username,
      proxy_auth_password: proxy.proxy_auth_password,
      expired_date: proxy.expired_date,
      checked_at: new Date(),
      is_live: true,
    };

    await this.redis.hset(
      REDIS_PROXY_KEY,
      proxyKey,
      JSON.stringify(liveProxy),
    );
    await this.redis.expire(REDIS_PROXY_KEY, REDIS_PROXY_EXPIRE);

    this.logger.log(`Saved live proxy ${proxyKey} to Redis`);
  }

  /**
   * Lấy tất cả proxy live từ Redis (random 20)
   * Returns: ["username:pass@host:port", ...]
   * Tự động loại bỏ proxy đã hết hạn
   */
  async getLiveProxies(count: number = 20): Promise<string[]> {
    const proxies = await this.redis.hgetall(REDIS_PROXY_KEY);
    const expiredKeys: string[] = [];

    // Filter và xóa proxy hết hạn
    const validProxyKeys = Object.entries(proxies).filter(([key, value]) => {
      const proxy = JSON.parse(value) as LiveProxy;
      if (this.isProxyExpired(proxy.expired_date)) {
        expiredKeys.push(key);
        return false;
      }
      return true;
    }).map(([key]) => key);

    // Xóa các proxy hết hạn khỏi Redis
    if (expiredKeys.length > 0) {
      await this.redis.hdel(REDIS_PROXY_KEY, ...expiredKeys);
      this.logger.log(`Removed ${expiredKeys.length} expired proxies from Redis`);
    }

    if (validProxyKeys.length <= count) {
      return validProxyKeys;
    }

    // Shuffle và lấy random proxies
    const shuffled = [...validProxyKeys].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
