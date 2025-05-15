import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { Reward, RewardSchema } from './schemas/reward.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reward.name, schema: RewardSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [
    RewardsService,
    MongooseModule.forFeature([{ name: Reward.name, schema: RewardSchema }]),
  ],
})
export class RewardsModule {}
