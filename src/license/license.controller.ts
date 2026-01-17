import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LicenseService } from './license.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { HeartbeatLicenseDto } from './dto/heartbeat-license.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { RenewTokenDto } from './dto/renew-token.dto';

@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  /**
   * POST /api/license/activate
   * Activate/verify token và bind thiết bị
   */
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Body() dto: ActivateLicenseDto) {
    return this.licenseService.activate(dto);
  }

  /**
   * POST /api/license/heartbeat
   * Keep-alive
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Body() dto: HeartbeatLicenseDto) {
    return this.licenseService.heartbeat(dto);
  }

  /**
   * GET /api/license/me
   * Get license info
   */
  @Get('me')
  async getLicenseInfo(
    @Query('token') token: string,
    @Query('deviceFingerprint') deviceFingerprint: string,
  ) {
    return this.licenseService.getLicenseInfo(token, deviceFingerprint);
  }
}

@Controller('admin/tokens')
export class AdminTokenController {
  constructor(private readonly licenseService: LicenseService) {}

  /**
   * POST /api/admin/tokens
   * Create new token
   */
  @Post()
  async createToken(@Body() dto: CreateTokenDto) {
    return this.licenseService.createToken(dto);
  }

  /**
   * GET /api/admin/tokens/:tokenId/devices
   * List devices của 1 token
   */
  @Get(':tokenId/devices')
  async listDevices(@Param('tokenId') tokenId: string) {
    return this.licenseService.listDevices(tokenId);
  }

  /**
   * POST /api/admin/tokens/:tokenId/devices/:deviceId/revoke
   * Revoke một thiết bị
   */
  @Post(':tokenId/devices/:deviceId/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeDevice(
    @Param('tokenId') tokenId: string,
    @Param('deviceId') deviceId: string,
  ) {
    return this.licenseService.revokeDevice(tokenId, deviceId);
  }

  /**
   * POST /api/admin/tokens/:tokenId/suspend
   * Suspend token
   */
  @Post(':tokenId/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendToken(@Param('tokenId') tokenId: string) {
    return this.licenseService.suspendToken(tokenId);
  }

  /**
   * POST /api/admin/tokens/:tokenId/activate
   * Reactivate token
   */
  @Post(':tokenId/activate')
  @HttpCode(HttpStatus.OK)
  async activateToken(@Param('tokenId') tokenId: string) {
    return this.licenseService.activateToken(tokenId);
  }

  /**
   * POST /api/admin/tokens/:tokenId/renew
   * Renew monthly token
   */
  @Post(':tokenId/renew')
  async renewToken(
    @Param('tokenId') tokenId: string,
    @Body() dto: RenewTokenDto,
  ) {
    return this.licenseService.renewToken(tokenId, dto);
  }
}
