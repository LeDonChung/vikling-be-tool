import { IsString, IsOptional, IsIn } from 'class-validator';

export class TranscribeAudioDto {
  @IsOptional()
  @IsString()
  @IsIn(['tiny', 'base', 'small', 'medium', 'large'], {
    message: 'Model must be one of: tiny, base, small, medium, large',
  })
  model?: string = 'small';

  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en', 'auto'], {
    message: 'Language must be: vi (Vietnamese), en (English), or auto',
  })
  language?: string = 'vi';

  @IsOptional()
  @IsString()
  translate?: string = 'false'; // Translate to English if true
}
