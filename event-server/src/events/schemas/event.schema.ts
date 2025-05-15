import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ENDED = 'ENDED',
  SCHEDULED = 'SCHEDULED',
}

export enum EventConditionType {
  LOGIN_STREAK = 'LOGIN_STREAK',
  FRIEND_INVITATION = 'FRIEND_INVITATION',
  QUEST_CLEAR = 'QUEST_CLEAR',
  MINIMUM_PURCHASE = 'MINIMUM_PURCHASE',
  ALWAYS_TRUE = 'ALWAYS_TRUE',
}

export interface EventConditionDetail {
  type: EventConditionType;
  value: number | string | boolean;
  description?: string;
}

export type EventDocument = Event & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'events' })
export class Event {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({
    type: String,
    enum: Object.values(EventStatus),
    default: EventStatus.SCHEDULED,
    index: true,
  })
  status: EventStatus;

  @Prop({ type: [{ type: SchemaTypes.Mixed }], default: [] })
  conditions: EventConditionDetail[];

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('이벤트 종료일은 시작일보다 이후여야 합니다.'));
  } else {
    next();
  }
});
