import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reward, RewardDocument } from './schemas/reward.schema';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { Event, EventDocument } from '../events/schemas/event.schema';

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(
    createRewardDto: CreateRewardDto,
    createdBy: string,
  ): Promise<RewardDocument> {
    const event = await this.eventModel
      .findById(createRewardDto.eventId)
      .exec();
    if (!event) {
      throw new NotFoundException(
        `ID가 "${createRewardDto.eventId}"인 이벤트를 찾을 수 없습니다.`,
      );
    }

    const newReward = new this.rewardModel({
      ...createRewardDto,
      eventId: new Types.ObjectId(createRewardDto.eventId),
      createdBy: new Types.ObjectId(createdBy),
    });
    return newReward.save();
  }

  async findAllByEventId(eventId: string): Promise<RewardDocument[]> {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('유효하지 않은 이벤트 ID 형식입니다.');
    }
    return this.rewardModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .exec();
  }

  async findOne(id: string): Promise<RewardDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 보상 ID 형식입니다.');
    }
    const reward = await this.rewardModel.findById(id).exec();
    if (!reward) {
      throw new NotFoundException(`ID가 "${id}"인 보상을 찾을 수 없습니다.`);
    }
    return reward;
  }

  async update(
    id: string,
    updateRewardDto: UpdateRewardDto,
    updatedBy: string,
  ): Promise<RewardDocument> {
    if (updateRewardDto.eventId) {
      const event = await this.eventModel
        .findById(updateRewardDto.eventId)
        .exec();
      if (!event) {
        throw new NotFoundException(
          `ID가 "${updateRewardDto.eventId}"인 이벤트를 찾을 수 없습니다.`,
        );
      }
    }

    const updatedReward = await this.rewardModel
      .findByIdAndUpdate(id, updateRewardDto, { new: true })
      .exec();
    if (!updatedReward) {
      throw new NotFoundException(`ID가 "${id}"인 보상을 찾을 수 없습니다.`);
    }
    return updatedReward;
  }

  async remove(id: string, removedBy: string): Promise<{ message: string }> {
    const result = await this.rewardModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`ID가 "${id}"인 보상을 찾을 수 없습니다.`);
    }
    return { message: `보상 (ID: ${id})이 성공적으로 삭제되었습니다.` };
  }
}
