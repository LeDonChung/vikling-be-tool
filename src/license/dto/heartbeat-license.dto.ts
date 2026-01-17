import { IsString, IsNotEmpty } from 'class-validator';

export class HeartbeatLicenseDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;
}
