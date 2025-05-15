import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export enum RewardRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export type RewardRequestDocument = RewardRequest & Document<Types.ObjectId>;

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
  eventId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Reward',
    required: true,
    index: true,
  })
  rewardId: Types.ObjectId;

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

export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest);
