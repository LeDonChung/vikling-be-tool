import { IsInt, Min } from 'class-validator';

export class RenewTokenDto {
  @IsInt()
  @Min(1)
  extendDays: number;
}
