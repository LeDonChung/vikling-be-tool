import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Platform } from 'src/common/shared/Platform';

export class ActivateLicenseDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsEnum(Platform)
  @IsOptional()
  platform?: Platform;

  @IsString()
  @IsOptional()
  appVersion?: string;
}
