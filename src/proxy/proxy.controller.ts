import { Controller, Get, Post, Param, Delete } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Lấy danh sách proxy từ API 1IP
   */
  @Get('list')
  async getProxyList() {
    const proxies = await this.proxyService.getProxyList();
    return {
      success: true,
      data: proxies,
      count: proxies.length,
    };
  }

  /**
   * Bắt đầu kiểm tra tất cả proxy (thêm vào queue)
   */
  @Post('check')
  async startProxyCheck() {
    const result = await this.proxyService.queueProxyCheck();
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Lấy danh sách proxy live từ Redis cache
   */
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
