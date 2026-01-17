import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ElabService } from './elelab.service';
import {
  ImportKeysResponseDto,
} from './dto/elelab.dto';
import { LicenseGuard } from 'src/license/guards/license.guard';

@Controller('elelab')
export class ElabController {
  constructor(private readonly elabService: ElabService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importKeys(
    @UploadedFile() file: Express.Multer.File
  ): Promise<ImportKeysResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileContent = file.buffer.toString('utf-8');
    const totalImported = await this.elabService.importKeysFromContent(
      fileContent,
    );

    return {
      success: true,
      message: `Successfully imported ${totalImported} keys`,
      totalImported,
    };
  }

  @Get('list-keys')
  @UseGuards(LicenseGuard)
  async listAllKeys() {
    const keys = await this.elabService.listAllElabKeys();
    return {
      success: true,
      data: keys,
      count: keys.length,
    };
  }
}
