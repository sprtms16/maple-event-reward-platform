import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardRequestsService } from './reward-requests.service';
import { RewardRequestsController } from './reward-requests.controller';
import {
  RewardRequest,
  RewardRequestSchema,
} from './schemas/reward-request.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { Reward, RewardSchema } from '../rewards/schemas/reward.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RewardRequest.name, schema: RewardRequestSchema },
      { name: Event.name, schema: EventSchema },
      { name: Reward.name, schema: RewardSchema },
    ]),
  ],
  controllers: [RewardRequestsController],
  providers: [RewardRequestsService],
})
export class RewardRequestsModule {}
