import { Test, TestingModule } from '@nestjs/testing';
import { TtsfreeController } from './ttsfree.controller';
import { TtsfreeService } from './ttsfree.service';

describe('TtsfreeController', () => {
  let controller: TtsfreeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TtsfreeController],
      providers: [TtsfreeService],
    }).compile();

    controller = module.get<TtsfreeController>(TtsfreeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
