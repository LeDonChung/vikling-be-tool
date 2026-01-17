import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiKeysService } from './apikeys.service';
import {
  ApiKeyProvider,
  API_KEY_PROVIDERS,
  ImportApiKeysDto,
  ImportApiKeysResponseDto,
  ListApiKeysResponseDto,
} from './dto/apikeys.dto';

@Controller('apikeys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Import API keys từ JSON body
   * POST /apikeys/import
   */
  @Post('import')
  async importKeys(@Body() dto: ImportApiKeysDto): Promise<ImportApiKeysResponseDto> {
    const totalImported = await this.apiKeysService.importKeys(dto.provider, dto.keys);

    return {
      success: true,
      message: `Successfully imported ${totalImported} keys`,
      totalImported,
      provider: dto.provider,
    };
  }

  /**
   * Import API keys từ file
   * POST /apikeys/import-file/:provider
   */
  @Post('import-file/:provider')
  @UseInterceptors(FileInterceptor('file'))
  async importKeysFromFile(
    @Param('provider') provider: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportApiKeysResponseDto> {
    if (!API_KEY_PROVIDERS.includes(provider as ApiKeyProvider)) {
      throw new BadRequestException(
        `Invalid provider. Must be one of: ${API_KEY_PROVIDERS.join(', ')}`,
      );
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileContent = file.buffer.toString('utf-8');
    const totalImported = await this.apiKeysService.importKeysFromContent(
      provider as ApiKeyProvider,
      fileContent,
    );

    return {
      success: true,
      message: `Successfully imported ${totalImported} keys`,
      totalImported,
      provider: provider as ApiKeyProvider,
    };
  }

  /**
   * Lấy danh sách API keys theo provider
   * GET /apikeys/list/:provider
   */
  @Get('list/:provider')
  async listKeys(@Param('provider') provider: string): Promise<ListApiKeysResponseDto> {
    if (!API_KEY_PROVIDERS.includes(provider as ApiKeyProvider)) {
      throw new BadRequestException(
        `Invalid provider. Must be one of: ${API_KEY_PROVIDERS.join(', ')}`,
      );
    }

    const keys = await this.apiKeysService.listKeys(provider as ApiKeyProvider);

    return {
      success: true,
      data: keys,
      count: keys.length,
      provider: provider as ApiKeyProvider,
    };
  }

  /**
   * Lấy thống kê số keys của tất cả providers
   * GET /apikeys/stats
   */
  @Get('stats')
  async getStats() {
    const stats = await this.apiKeysService.getStats();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Xóa một API key cụ thể
   * DELETE /apikeys/:provider/:key
   */
  @Delete(':provider/:key')
  async deleteKey(
    @Param('provider') provider: string,
    @Param('key') key: string,
  ) {
    if (!API_KEY_PROVIDERS.includes(provider as ApiKeyProvider)) {
      throw new BadRequestException(
        `Invalid provider. Must be one of: ${API_KEY_PROVIDERS.join(', ')}`,
      );
    }

    const deleted = await this.apiKeysService.deleteKey(
      provider as ApiKeyProvider,
      decodeURIComponent(key),
    );

    return {
      success: deleted,
      message: deleted ? 'Key deleted successfully' : 'Key not found',
    };
  }

  /**
   * Xóa tất cả API keys của một provider
   * DELETE /apikeys/:provider
   */
  @Delete(':provider')
  async deleteAllKeys(@Param('provider') provider: string) {
    if (!API_KEY_PROVIDERS.includes(provider as ApiKeyProvider)) {
      throw new BadRequestException(
        `Invalid provider. Must be one of: ${API_KEY_PROVIDERS.join(', ')}`,
      );
    }

    const count = await this.apiKeysService.deleteAllKeys(provider as ApiKeyProvider);

    return {
      success: true,
      message: `Deleted ${count} keys`,
      deletedCount: count,
    };
  }
}
