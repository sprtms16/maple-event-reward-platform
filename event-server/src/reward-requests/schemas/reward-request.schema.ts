import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  SchemaTypes,
  Types,
  PopulatedDoc,
  HydratedDocument,
  Schema as MongooseSchema,
} from 'mongoose';
import { EventDocument } from '../../events/schemas/event.schema';
import { RewardDocument } from '../../rewards/schemas/reward.schema';

export enum RewardRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, collection: 'reward_requests' })
export class RewardRequest {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  })
  eventId: PopulatedDoc<EventDocument | Types.ObjectId>;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Reward',
    required: true,
    index: true,
  })
  rewardId: PopulatedDoc<RewardDocument | Types.ObjectId>;

  @Prop({
    type: String,
    enum: Object.values(RewardRequestStatus),
    default: RewardRequestStatus.PENDING,
    index: true,
  })
  status: RewardRequestStatus;

  @Prop({ type: Date, default: Date.now })
  requestedAt: Date;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop({ type: SchemaTypes.ObjectId })
  processorId?: Types.ObjectId;

  @Prop({ trim: true })
  failureReason?: string;

  @Prop({ type: SchemaTypes.Mixed })
  transactionDetails?: Record<string, any>;
}

export type RewardRequestDocument = HydratedDocument<RewardRequest>;
export const RewardRequestSchema: MongooseSchema<RewardRequest> =
  SchemaFactory.createForClass(RewardRequest);
