import { Injectable } from '@nestjs/common';
import { CreateGeminiDto } from './dto/create-gemini.dto';
import { UpdateGeminiDto } from './dto/update-gemini.dto';

@Injectable()
export class GeminiService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createGeminiDto: CreateGeminiDto) {
    return 'This action adds a new gemini';
  }

  findAll() {
    return `This action returns all gemini`;
  }

  findOne(id: number) {
    return `This action returns a #${id} gemini`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateGeminiDto: UpdateGeminiDto) {
    return `This action updates a #${id} gemini`;
  }

  remove(id: number) {
    return `This action removes a #${id} gemini`;
  }
}
