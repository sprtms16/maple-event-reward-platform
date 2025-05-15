import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export enum RewardType {
  POINT = 'POINT',
  ITEM = 'ITEM',
  COUPON = 'COUPON',
  CURRENCY = 'CURRENCY',
}

export type RewardDocument = Reward & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'rewards' })
export class Reward {
  _id!: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  })
  eventId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(RewardType),
    required: true,
  })
  type: RewardType;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: SchemaTypes.Mixed })
  details?: Record<string, any>;

  @Prop({ type: Number, min: 0, default: null })
  stock?: number | null;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  createdBy: Types.ObjectId;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
