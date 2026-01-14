import { PartialType } from '@nestjs/mapped-types';
import { CreateGrokDto } from './create-grok.dto';

export class UpdateGrokDto extends PartialType(CreateGrokDto) {}
