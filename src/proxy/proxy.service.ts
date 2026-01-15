import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios, { AxiosProxyConfig } from 'axios';
import Redis from 'ioredis';
import {
  ProxyItem,
  GetProxyListResponse,
  ChangeIpResponse,
  LiveProxy,
} from './dto/proxy.dto';

const REDIS_PROXY_KEY = 'proxies';
const REDIS_PROXY_EXPIRE = 5 * 60;

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly redis: Redis;
  private readonly userToken: string;
  private readonly apiBaseUrl = 'https://api.1ip.vn';

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

      if (response.data.Status === 'Success' && response.data.Data) {
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
    const proxyConfig: AxiosProxyConfig = {
      host: proxy.public_ip,
      port: proxy.http_port,
    };

    try {
      const response = await axios.get('https://api.ipify.org?format=json', {
        proxy: proxyConfig,
        timeout: 10000,
      });

      if (response.status === 200) {
        this.logger.debug(`Proxy ${proxy.public_ip}:${proxy.http_port} is LIVE`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.debug(
        `Proxy ${proxy.public_ip}:${proxy.http_port} is DEAD: ${error.message}`,
      );
      return false;
    }
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
   * Lưu proxy live vào Redis
   */
  async saveLiveProxy(proxy: ProxyItem): Promise<void> {
    const liveProxy: LiveProxy = {
      id: proxy.id,
      proxy_type: proxy.proxy_type,
      package_api_key: proxy.package_api_key,
      public_ip: proxy.public_ip,
      http_port: proxy.http_port,
      https_port: proxy.https_port,
      proxy_url: `http://${proxy.public_ip}:${proxy.http_port}`,
      checked_at: new Date(),
      is_live: true,
    };

    await this.redis.hset(
      REDIS_PROXY_KEY,
      proxy.id.toString(),
      JSON.stringify(liveProxy),
    );
    await this.redis.expire(REDIS_PROXY_KEY, REDIS_PROXY_EXPIRE);

    this.logger.log(`Saved live proxy ${proxy.id} to Redis`);
  }

  /**
   * Lấy tất cả proxy live từ Redis
   */
  async getLiveProxies(): Promise<LiveProxy[]> {
    const proxies = await this.redis.hgetall(REDIS_PROXY_KEY);
    return Object.values(proxies).map((p) => JSON.parse(p) as LiveProxy);
  }
}
