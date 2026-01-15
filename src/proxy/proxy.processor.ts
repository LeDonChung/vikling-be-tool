import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProxyService } from './proxy.service';
import { ProxyCheckJob } from './dto/proxy.dto';

@Processor('proxy-check', {
  concurrency: 5, // Xử lý 5 proxy cùng lúc
})
export class ProxyProcessor extends WorkerHost {
  private readonly logger = new Logger(ProxyProcessor.name);

  constructor(private readonly proxyService: ProxyService) {
    super();
  }

  async process(job: Job<ProxyCheckJob>): Promise<{ isLive: boolean }> {
    const { proxy } = job.data;

    this.logger.debug(
      `Processing proxy check for ${proxy.public_ip}:${proxy.http_port}`,
    );

    try {
      const isLive = await this.proxyService.checkProxyLive(proxy);

      if (isLive) {
        await this.proxyService.saveLiveProxy(proxy);
        this.logger.log(
          `✅ Proxy ${proxy.id} (${proxy.public_ip}:${proxy.http_port}) is LIVE`,
        );
      } else {
        this.logger.log(
          `❌ Proxy ${proxy.id} (${proxy.public_ip}:${proxy.http_port}) is DEAD`,
        );
      }

      return { isLive };
    } catch (error) {
      this.logger.error(
        `Error checking proxy ${proxy.id}: ${error.message}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ProxyCheckJob>) {
    this.logger.debug(`Job ${job.id} completed for proxy ${job.data.proxy.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ProxyCheckJob>, error: Error) {
    this.logger.error(
      `Job ${job.id} failed for proxy ${job.data.proxy.id}: ${error.message}`,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<ProxyCheckJob>) {
    this.logger.debug(`Job ${job.id} started for proxy ${job.data.proxy.id}`);
  }
}
