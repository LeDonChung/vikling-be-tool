import { IsString, IsNotEmpty, MaxLength, IsNumber, IsIn, Min, Max, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTtsfreeDto {
  @IsString()
  @IsNotEmpty({ message: 'Text is required' })
  @MaxLength(500, { message: 'Text must not exceed 500 characters' })
  text: string;

  @IsOptional()
  @IsString()
  @IsIn(['vi-VN'], { message: 'Currently only Vietnamese (vi-VN) is supported' })
  @Transform(({ value }) => value || 'vi-VN')
  language?: string = 'vi-VN';

  @IsOptional()
  @IsString()
  @IsIn(['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'], { 
    message: 'Voice must be either Hoài My (vi-VN-HoaiMyNeural) or Nam Minh (vi-VN-NamMinhNeural)' 
  })
  @Transform(({ value }) => value || 'vi-VN-HoaiMyNeural')
  voice?: string = 'vi-VN-HoaiMyNeural';

  @IsOptional()
  @IsNumber()
  @Min(-50, { message: 'Voice speed must be between -50 and 50' })
  @Max(50, { message: 'Voice speed must be between -50 and 50' })
  @Transform(({ value }) => value ?? 0)
  voiceSpeed?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(-50, { message: 'Speech pitch must be between -50 and 50' })
  @Max(50, { message: 'Speech pitch must be between -50 and 50' })
  @Transform(({ value }) => value ?? 0)
  speechPitch?: number = 0;
}

