import { Injectable } from '@nestjs/common';
import { CreateGrokDto } from './dto/create-grok.dto';
import { UpdateGrokDto } from './dto/update-grok.dto';

@Injectable()
export class GrokService {
  create(createGrokDto: CreateGrokDto) {
    return 'This action adds a new grok';
  }

  findAll() {
    return `This action returns all grok`;
  }

  findOne(id: number) {
    return `This action returns a #${id} grok`;
  }

  update(id: number, updateGrokDto: UpdateGrokDto) {
    return `This action updates a #${id} grok`;
  }

  remove(id: number) {
    return `This action removes a #${id} grok`;
  }
}
