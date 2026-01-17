import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from 'src/entities/token.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { LicenseType } from 'src/common/shared/LicenseType';
import { TokenStatus } from 'src/common/shared/TokenStatus';

/**
 * Guard để kiểm tra license type = LICENSE_MONTHLY_FULL
 * Dùng cho các endpoint cần quyền MONTHLY_FULL (proxy, elelab keys)
 */
@Injectable()
export class LicenseGuard implements CanActivate {
  private readonly logger = new Logger(LicenseGuard.name);
  private readonly serverSalt: string;

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly configService: ConfigService,
  ) {
    this.serverSalt =
      this.configService.get<string>('LICENSE_SERVER_SALT') ||
      'default-salt-change-me';
  }

  private hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token + this.serverSalt)
      .digest('hex');
  }

  /**
   * Lấy thời gian hiện tại theo múi giờ Vietnam
   */
  private getVietnamTime(): Date {
    return new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-license-token'];

    if (!token) {
      this.logger.warn('Missing x-license-token header');
      throw new UnauthorizedException('License token required');
    }

    try {
      // Hash và tìm token trong DB
      const tokenHash = this.hashToken(token);
      const tokenEntity = await this.tokenRepository.findOne({
        where: { tokenHash },
      });

      if (!tokenEntity) {
        this.logger.warn(`Invalid token: ${token.substring(0, 8)}...`);
        throw new UnauthorizedException('Invalid license token');
      }

      // Check token status
      if (tokenEntity.status !== TokenStatus.ACTIVE) {
        this.logger.warn(
          `Token ${tokenEntity.id} is ${tokenEntity.status}`,
        );
        throw new UnauthorizedException(`License is ${tokenEntity.status}`);
      }

      // Check license type phải là MONTHLY_FULL
      if (tokenEntity.type !== LicenseType.LICENSE_MONTHLY_FULL) {
        this.logger.warn(
          `Token ${tokenEntity.id} type is ${tokenEntity.type}, required MONTHLY_FULL`,
        );
        throw new ForbiddenException(
          'This feature requires LICENSE_MONTHLY_FULL subscription',
        );
      }

      // Check thời gian hết hạn (theo giờ Vietnam)
      if (tokenEntity.expiresAt) {
        const vietnamNow = this.getVietnamTime();
        if (vietnamNow > tokenEntity.expiresAt) {
          this.logger.warn(
            `Token ${tokenEntity.id} expired at ${tokenEntity.expiresAt}`,
          );
          throw new UnauthorizedException('License expired, please renew');
        }
      }

      // Check startsAt nếu có
      if (tokenEntity.startsAt) {
        const vietnamNow = this.getVietnamTime();
        if (vietnamNow < tokenEntity.startsAt) {
          this.logger.warn(
            `Token ${tokenEntity.id} not yet active until ${tokenEntity.startsAt}`,
          );
          throw new UnauthorizedException('License not yet active');
        }
      }

      // Pass - attach token info vào request để controller có thể dùng
      request.licenseInfo = {
        tokenId: tokenEntity.id,
        type: tokenEntity.type,
        expiresAt: tokenEntity.expiresAt,
      };

      this.logger.log(`License verified for token ${tokenEntity.id}`);
      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error verifying license: ${error.message}`);
      throw new UnauthorizedException('License verification failed');
    }
  }
}
