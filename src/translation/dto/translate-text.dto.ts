import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TranslateTextDto {
  @IsString()
  @IsNotEmpty({ message: 'Text is required' })
  text: string;

  @IsOptional()
  @IsString()
  source?: string = 'en'; // Source language code (e.g., 'en', 'vi', 'zh', 'ja')

  @IsString()
  @IsNotEmpty({ message: 'Target language is required' })
  target: string = 'vi'; // Target language code (e.g., 'en', 'vi', 'zh', 'ja')
}
