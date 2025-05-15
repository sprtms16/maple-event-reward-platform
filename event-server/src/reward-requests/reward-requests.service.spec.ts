import { Test, TestingModule } from '@nestjs/testing';
import { RewardRequestsService } from './reward-requests.service';

describe('RewardRequestsService', () => {
  let service: RewardRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RewardRequestsService],
    }).compile();

    service = module.get<RewardRequestsService>(RewardRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
