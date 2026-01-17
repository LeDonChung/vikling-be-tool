import { IsEnum, IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { LicenseType } from 'src/common/shared/LicenseType';

export class CreateTokenDto {
  @IsEnum(LicenseType)
  type: LicenseType;

  @IsInt()
  @Min(1)
  maxDevices: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsOptional()
  meta?: Record<string, any>;
}
