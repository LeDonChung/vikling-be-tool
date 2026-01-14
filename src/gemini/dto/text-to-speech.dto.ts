import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class TextToSpeechDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  text: string;

  @IsString()
  @IsOptional()
  voiceName?: string;

  @IsString()
  @IsOptional()
  languageCode?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  styleInstructions?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;
}
