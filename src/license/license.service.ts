import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Token } from 'src/entities/token.entity';
import { TokenDevice } from 'src/entities/token-device.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { HeartbeatLicenseDto } from './dto/heartbeat-license.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { RenewTokenDto } from './dto/renew-token.dto';
import { TokenStatus } from 'src/common/shared/TokenStatus';
import { LicenseType } from 'src/common/shared/LicenseType';

@Injectable()
export class LicenseService implements OnModuleInit {
  private readonly logger = new Logger(LicenseService.name);
  private readonly serverSalt: string;
  private readonly EXPIRE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(TokenDevice)
    private readonly tokenDeviceRepository: Repository<TokenDevice>,
    private readonly configService: ConfigService,
    @InjectQueue('license-jobs') private readonly licenseQueue: Queue,
  ) {
    this.serverSalt = this.configService.get<string>('LICENSE_SERVER_SALT') || 'default-salt-change-me';
  }

  async onModuleInit() {
    // Remove old repeatable job if exists
    await this.licenseQueue.removeRepeatableByKey('expire-tokens:daily');

    // Schedule expire tokens job to run every 24 hours
    await this.licenseQueue.add(
      'expire-tokens',
      {},
      {
        repeat: {
          every: this.EXPIRE_CHECK_INTERVAL,
        },
        jobId: 'expire-tokens:daily',
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log('🔄 Scheduled token expiration job every 24 hours');
  }

  /**
   * Hash token với salt để lưu vào DB
   */
  private hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token + this.serverSalt)
      .digest('hex');
  }

  /**
   * Hash device fingerprint với salt
   */
  private hashDeviceFingerprint(fingerprint: string): string {
    return crypto
      .createHash('sha256')
      .update(fingerprint + this.serverSalt)
      .digest('hex');
  }

  /**
   * Generate random token string
   */
  private generateTokenString(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const parts: string[] = [];
    for (let i = 0; i < 4; i++) {
      let part = '';
      for (let j = 0; j < 4; j++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      parts.push(part);
    }
    return parts.join('-');
  }

  /**
   * Verify token validity
   */
  private async verifyToken(tokenHash: string): Promise<Token> {
    const token = await this.tokenRepository.findOne({
      where: { tokenHash },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    if (token.status !== TokenStatus.ACTIVE) {
      throw new UnauthorizedException(`Token is ${token.status}`);
    }

    if (token.startsAt && new Date() < token.startsAt) {
      throw new UnauthorizedException('Token not yet active');
    }

    if (token.expiresAt && new Date() > token.expiresAt) {
      // Auto-expire
      token.status = TokenStatus.EXPIRED;
      await this.tokenRepository.save(token);
      throw new UnauthorizedException('Token expired');
    }

    return token;
  }

  /**
   * POST /api/license/activate
   * Activate/verify token và bind thiết bị
   */
  async activate(dto: ActivateLicenseDto) {
    const tokenHash = this.hashToken(dto.token);
    const deviceFpHash = this.hashDeviceFingerprint(dto.deviceFingerprint);

    // Verify token
    const token = await this.verifyToken(tokenHash);

    // Transaction để enforce max_devices
    return await this.tokenRepository.manager.transaction(async (manager) => {
      const tokenRepo = manager.getRepository(Token);
      const deviceRepo = manager.getRepository(TokenDevice);

      // Tìm thiết bị hiện tại
      let device = await deviceRepo.findOne({
        where: {
          tokenId: token.id,
          deviceFpHash,
        },
      });

      if (device) {
        // Thiết bị đã tồn tại
        if (device.revokedAt) {
          // Reactivate
          device.revokedAt = null;
        }
        device.lastSeenAt = new Date();
        device.deviceName = dto.deviceName || device.deviceName;
        device.platform = dto.platform || device.platform;
        device.appVersion = dto.appVersion || device.appVersion;
        await deviceRepo.save(device);
      } else {
        // Thiết bị mới - check max_devices
        const activeDevicesCount = await deviceRepo.count({
          where: {
            tokenId: token.id,
            revokedAt: IsNull(),
          },
        });

        if (activeDevicesCount >= token.maxDevices) {
          throw new BadRequestException('MAX_DEVICES_REACHED');
        }

        // Insert thiết bị mới
        device = deviceRepo.create({
          tokenId: token.id,
          deviceFpHash,
          deviceName: dto.deviceName,
          platform: dto.platform,
          appVersion: dto.appVersion,
          lastSeenAt: new Date(),
        });
        await deviceRepo.save(device);
      }

      // Update last_used_at của token
      token.lastUsedAt = new Date();
      await tokenRepo.save(token);

      return {
        valid: true,
        tokenType: token.type,
        expiresAt: token.expiresAt,
        maxDevices: token.maxDevices,
      };
    });
  }

  /**
   * POST /api/license/heartbeat
   * Keep-alive và update last_seen_at
   */
  async heartbeat(dto: HeartbeatLicenseDto) {
    const tokenHash = this.hashToken(dto.token);
    const deviceFpHash = this.hashDeviceFingerprint(dto.deviceFingerprint);

    // Verify token
    const token = await this.verifyToken(tokenHash);

    // Update device last_seen_at
    const device = await this.tokenDeviceRepository.findOne({
      where: {
        tokenId: token.id,
        deviceFpHash,
        revokedAt: IsNull(),
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found or revoked');
    }

    device.lastSeenAt = new Date();
    await this.tokenDeviceRepository.save(device);

    // Update token last_used_at
    token.lastUsedAt = new Date();
    await this.tokenRepository.save(token);

    return { valid: true };
  }

  /**
   * GET /api/license/me
   * Get license info cho thiết bị hiện tại
   */
  async getLicenseInfo(token: string, deviceFingerprint: string) {
    const tokenHash = this.hashToken(token);
    const deviceFpHash = this.hashDeviceFingerprint(deviceFingerprint);

    const tokenEntity = await this.verifyToken(tokenHash);

    // Verify device belongs to token
    const device = await this.tokenDeviceRepository.findOne({
      where: {
        tokenId: tokenEntity.id,
        deviceFpHash,
        revokedAt: IsNull(),
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found or revoked');
    }

    const activeDevices = await this.tokenDeviceRepository.count({
      where: {
        tokenId: tokenEntity.id,
        revokedAt: IsNull(),
      },
    });

    return {
      type: tokenEntity.type,
      expiresAt: tokenEntity.expiresAt,
      activeDevices,
      maxDevices: tokenEntity.maxDevices,
    };
  }

  /**
   * POST /api/admin/tokens
   * Create new token (admin only)
   */
  async createToken(dto: CreateTokenDto): Promise<{ token: string; id: string }> {
    const tokenString = this.generateTokenString();
    const tokenHash = this.hashToken(tokenString);

    const token = this.tokenRepository.create({
      type: dto.type,
      tokenHash,
      maxDevices: dto.maxDevices,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      meta: dto.meta || null,
      status: TokenStatus.ACTIVE,
    });

    await this.tokenRepository.save(token);

    this.logger.log(`Created token: ${token.id}`);

    // Return plain-text token ONLY ONCE
    return {
      token: tokenString,
      id: token.id,
    };
  }

  /**
   * GET /api/admin/tokens/:tokenId/devices
   * List devices của 1 token
   */
  async listDevices(tokenId: string) {
    const token = await this.tokenRepository.findOne({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const devices = await this.tokenDeviceRepository.find({
      where: { tokenId },
      order: { firstSeenAt: 'DESC' },
    });

    return devices.map((device) => ({
      id: device.id,
      deviceName: device.deviceName,
      platform: device.platform,
      appVersion: device.appVersion,
      firstSeenAt: device.firstSeenAt,
      lastSeenAt: device.lastSeenAt,
      revokedAt: device.revokedAt,
    }));
  }

  /**
   * POST /api/admin/tokens/:tokenId/devices/:deviceId/revoke
   * Revoke một thiết bị
   */
  async revokeDevice(tokenId: string, deviceId: string) {
    const device = await this.tokenDeviceRepository.findOne({
      where: { id: deviceId, tokenId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.revokedAt = new Date();
    await this.tokenDeviceRepository.save(device);

    this.logger.log(`Revoked device ${deviceId} from token ${tokenId}`);

    return { success: true };
  }

  /**
   * POST /api/admin/tokens/:tokenId/suspend
   * Suspend token
   */
  async suspendToken(tokenId: string) {
    const token = await this.tokenRepository.findOne({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    token.status = TokenStatus.SUSPENDED;
    await this.tokenRepository.save(token);

    this.logger.log(`Suspended token ${tokenId}`);

    return { success: true };
  }

  /**
   * POST /api/admin/tokens/:tokenId/activate
   * Reactivate token
   */
  async activateToken(tokenId: string) {
    const token = await this.tokenRepository.findOne({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    token.status = TokenStatus.ACTIVE;
    await this.tokenRepository.save(token);

    this.logger.log(`Activated token ${tokenId}`);

    return { success: true };
  }

  /**
   * POST /api/admin/tokens/:tokenId/renew
   * Renew monthly token
   */
  async renewToken(tokenId: string, dto: RenewTokenDto) {
    const token = await this.tokenRepository.findOne({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const currentExpiry = token.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + dto.extendDays);

    token.expiresAt = newExpiry;
    token.status = TokenStatus.ACTIVE; // Reactivate if expired
    await this.tokenRepository.save(token);

    this.logger.log(`Renewed token ${tokenId} for ${dto.extendDays} days`);

    return {
      success: true,
      expiresAt: token.expiresAt,
    };
  }

  /**
   * Background job: Expire tokens
   * Gọi bởi cron job mỗi ngày
   */
  async expireTokens() {
    const expiredTokens = await this.tokenRepository.find({
      where: {
        status: TokenStatus.ACTIVE,
        expiresAt: Not(IsNull()),
      },
    });

    let count = 0;
    const now = new Date();

    for (const token of expiredTokens) {
      if (token.expiresAt && now > token.expiresAt) {
        token.status = TokenStatus.EXPIRED;
        await this.tokenRepository.save(token);
        count++;
      }
    }

    this.logger.log(`Expired ${count} tokens`);
    return { expiredCount: count };
  }
}
