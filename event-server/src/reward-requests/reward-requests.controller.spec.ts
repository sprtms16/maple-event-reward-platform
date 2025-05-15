import { Test, TestingModule } from '@nestjs/testing';
import { RewardRequestsController } from './reward-requests.controller';

describe('RewardRequestsController', () => {
  let controller: RewardRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RewardRequestsController],
    }).compile();

    controller = module.get<RewardRequestsController>(RewardRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
