import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProxyService } from './proxy.service';
import { ProxyCheckJob } from './dto/proxy.dto';

@Processor('proxy-check', {
  concurrency: 5,
})
export class ProxyProcessor extends WorkerHost {
  private readonly logger = new Logger(ProxyProcessor.name);

  constructor(private readonly proxyService: ProxyService) {
    super();
  }

  async process(job: Job<ProxyCheckJob | { recheck: boolean }>): Promise<{ isLive: boolean } | { recheckQueued: boolean }> {
    if (job.name === 'recheck-all-proxies') {
      await this.proxyService.queueProxyCheck();
      return { recheckQueued: true };
    }

    const { proxy } = job.data as ProxyCheckJob;

    try {
      const isLive = await this.proxyService.checkProxyLive(proxy);

      if (isLive) {
        await this.proxyService.saveLiveProxy(proxy);
      } else {
        this.logger.log(
          `Proxy ${proxy.id} (${proxy.public_ip}:${proxy.http_port}) is DEAD`,
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
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ProxyCheckJob>, error: Error) {
    this.logger.error(
      `Job ${job.id} failed for proxy ${job.data.proxy}: ${error.message}`,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<ProxyCheckJob>) {
  }
}
