import { IsString, IsOptional, IsIn, IsArray } from 'class-validator';

export type ApiKeyProvider = 'gemini' | 'chatgpt' | 'elevenlabs';

export const API_KEY_PROVIDERS: ApiKeyProvider[] = ['gemini', 'chatgpt', 'elevenlabs'];

export class ImportApiKeysDto {
  @IsString()
  @IsIn(API_KEY_PROVIDERS)
  provider: ApiKeyProvider;

  @IsArray()
  @IsString({ each: true })
  keys: string[];
}

export class ImportApiKeysResponseDto {
  success: boolean;
  message: string;
  totalImported: number;
  provider: ApiKeyProvider;
}

export class ListApiKeysResponseDto {
  success: boolean;
  data: string[];
  count: number;
  provider: ApiKeyProvider;
}

export class DeleteApiKeyDto {
  @IsString()
  @IsIn(API_KEY_PROVIDERS)
  provider: ApiKeyProvider;

  @IsString()
  key: string;
}

export class DeleteAllApiKeysDto {
  @IsString()
  @IsIn(API_KEY_PROVIDERS)
  provider: ApiKeyProvider;
}
