import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument, EventStatus } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    createdBy: string,
  ): Promise<EventDocument> {
    if (
      new Date(createEventDto.endDate) <= new Date(createEventDto.startDate)
    ) {
      throw new BadRequestException(
        '이벤트 종료일은 시작일보다 이후여야 합니다.',
      );
    }
    const newEvent = new this.eventModel({
      ...createEventDto,
      createdBy: new Types.ObjectId(createdBy),
    });
    return newEvent.save();
  }

  async findAll(
    status?: EventStatus,
    showDeleted = false,
  ): Promise<EventDocument[]> {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (!showDeleted) {
      query.deletedAt = null;
    }
    return this.eventModel.find(query).sort({ startDate: -1 }).exec();
  }

  async findOne(id: string): Promise<EventDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('유효하지 않은 이벤트 ID 형식입니다.');
    }
    const event = await this.eventModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
    if (!event) {
      throw new NotFoundException(`ID가 "${id}"인 이벤트를 찾을 수 없습니다.`);
    }
    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    updatedBy: string,
  ): Promise<EventDocument> {
    const existingEvent = await this.findOne(id);

    if (
      (updateEventDto.startDate &&
        updateEventDto.endDate &&
        new Date(updateEventDto.endDate) <=
          new Date(updateEventDto.startDate)) ||
      (updateEventDto.startDate &&
        !updateEventDto.endDate &&
        existingEvent.endDate <= new Date(updateEventDto.startDate)) ||
      (!updateEventDto.startDate &&
        updateEventDto.endDate &&
        new Date(updateEventDto.endDate) <= existingEvent.startDate)
    ) {
      throw new BadRequestException(
        '이벤트 종료일은 시작일보다 이후여야 합니다.',
      );
    }

    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();
    if (!updatedEvent) {
      throw new NotFoundException(`ID가 "${id}"인 이벤트를 찾을 수 없습니다.`);
    }
    return updatedEvent;
  }

  async remove(id: string, removedBy: string): Promise<{ message: string }> {
    const result = await this.eventModel
      .updateOne({ _id: id, deletedAt: null }, { deletedAt: new Date() })
      .exec();
    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `ID가 "${id}"인 이벤트를 찾을 수 없거나 이미 삭제되었습니다.`,
      );
    }
    return { message: `이벤트 (ID: ${id})가 성공적으로 삭제되었습니다.` };
  }
}
