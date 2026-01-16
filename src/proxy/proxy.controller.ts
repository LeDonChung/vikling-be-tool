import { Controller, Get, Post, Param, Delete } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  async getProxyList() {
    const proxies = await this.proxyService.getProxyList();
    return {
      success: true,
      data: proxies,
      count: proxies.length,
    };
  }

  @Post('check')
  async startProxyCheck() {
    const result = await this.proxyService.queueProxyCheck();
    return {
      success: true,
      ...result,
    };
  }

  @Get('live')
  async getLiveProxies() {
    const proxies = await this.proxyService.getLiveProxies();
    return {
      success: true,
      data: proxies,
      count: proxies.length,
    };
  }
}
