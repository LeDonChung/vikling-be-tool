import { Controller, Get, Post, Param, Delete, UseGuards } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { LicenseGuard } from 'src/license/guards/license.guard';

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
  @UseGuards(LicenseGuard)
  async getLiveProxies() {
    const proxies = await this.proxyService.getLiveProxies();
    return {
      success: true,
      data: proxies,
      count: proxies.length,
    };
  }
}
