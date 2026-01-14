import { Test, TestingModule } from '@nestjs/testing';
import { TtsfreeService } from './ttsfree.service';

describe('TtsfreeService', () => {
  let service: TtsfreeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TtsfreeService],
    }).compile();

    service = module.get<TtsfreeService>(TtsfreeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
