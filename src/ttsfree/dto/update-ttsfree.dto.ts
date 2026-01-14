import { PartialType } from '@nestjs/mapped-types';
import { CreateTtsfreeDto } from './create-ttsfree.dto';

export class UpdateTtsfreeDto extends PartialType(CreateTtsfreeDto) {}
