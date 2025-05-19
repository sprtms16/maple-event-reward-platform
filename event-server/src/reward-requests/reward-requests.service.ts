import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RewardRequest,
  RewardRequestDocument,
  RewardRequestStatus,
} from './schemas/reward-request.schema';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { UpdateRewardRequestStatusDto } from './dto/update-reward-request-status.dto';
import {
  Event,
  EventDocument,
  EventStatus,
  EventConditionType,
} from '../events/schemas/event.schema';
import { Reward, RewardDocument } from '../rewards/schemas/reward.schema';
import { UserActivityService } from '../user-activity/user-activity.service';

@Injectable()
export class RewardRequestsService {
  private readonly logger = new Logger(RewardRequestsService.name);

  constructor(
    @InjectModel(RewardRequest.name)
    private rewardRequestModel: Model<RewardRequestDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    private readonly userActivityService: UserActivityService,
  ) {}

  async createRequest(
    userIdString: string,
    createDto: CreateRewardRequestDto,
  ): Promise<RewardRequestDocument> {
    this.logger.log(
      `User ${userIdString} attempting to create reward request for event ${createDto.eventId}, reward ${createDto.rewardId}`,
    );
    if (!userIdString) {
      this.logger.error('createRequest: userIdString is missing.');
      throw new InternalServerErrorException('사용자 ID를 확인할 수 없습니다.');
    }
    const userObjectId = new Types.ObjectId(userIdString);
    const eventObjectId = new Types.ObjectId(createDto.eventId);
    const rewardObjectId = new Types.ObjectId(createDto.rewardId);

    const event = await this.eventModel
      .findOne({ _id: eventObjectId, deletedAt: null })
      .exec();
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }
    if (
      event.status !== EventStatus.ACTIVE ||
      new Date() < event.startDate ||
      new Date() > event.endDate
    ) {
      throw new BadRequestException('현재 참여 가능한 이벤트가 아닙니다.');
    }

    const reward = await this.rewardModel
      .findOne({ _id: rewardObjectId, eventId: eventObjectId })
      .exec();
    if (!reward) {
      throw new NotFoundException(
        '해당 이벤트에 대한 보상을 찾을 수 없습니다.',
      );
    }
    if (reward.stock !== null && reward.stock <= 0) {
      throw new ConflictException('보상 재고가 소진되었습니다.');
    }

    const existingRequest = await this.rewardRequestModel
      .findOne({
        userId: userObjectId,
        eventId: eventObjectId,
        rewardId: rewardObjectId,
        status: {
          $in: [
            RewardRequestStatus.PENDING,
            RewardRequestStatus.APPROVED,
            RewardRequestStatus.COMPLETED,
          ],
        },
      })
      .exec();

    if (existingRequest) {
      throw new ConflictException('이미 이 보상을 요청했거나 처리 중입니다.');
    }

    const conditionsMet = await this.verifyEventConditions(
      userObjectId.toHexString(),
      event,
    );
    if (!conditionsMet) {
      const failedRequest = new this.rewardRequestModel({
        userId: userObjectId,
        eventId: eventObjectId,
        rewardId: rewardObjectId,
        status: RewardRequestStatus.REJECTED,
        failureReason: '이벤트 조건을 충족하지 못했습니다.',
        requestedAt: new Date(),
        processedAt: new Date(),
      });
      await failedRequest.save();
      throw new BadRequestException('이벤트 조건을 충족하지 못했습니다.');
    }

    const newRequest = new this.rewardRequestModel({
      userId: userObjectId,
      eventId: eventObjectId,
      rewardId: rewardObjectId,
      status: RewardRequestStatus.PENDING,
    });

    try {
      return await newRequest.save();
    } catch (error) {
      this.logger.error(`보상 요청 생성 실패: ${error.message}`, error.stack);
      if (error.code === 11000) {
        throw new ConflictException(
          '보상 요청 중 중복 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      }
      throw new InternalServerErrorException(
        '보상 요청 중 오류가 발생했습니다.',
      );
    }
  }

  private async verifyEventConditions(
    userIdString: string,
    event: EventDocument,
  ): Promise<boolean> {
    const eventIdString = event._id.toHexString();
    this.logger.log(
      `사용자 ${userIdString}의 이벤트 "${event.title}" (ID: ${eventIdString}) 조건 검증 시작...`,
    );
    if (!event.conditions || event.conditions.length === 0) {
      this.logger.log('검증할 조건 없음. 통과 처리.');
      return true;
    }

    for (const condition of event.conditions) {
      this.logger.debug(
        `조건 검증 중: 타입=${condition.type}, 값=${condition.value}`,
      );
      let conditionResult = false;
      switch (condition.type) {
        case EventConditionType.LOGIN_STREAK: {
          const loginStreak =
            await this.userActivityService.getLoginStreak(userIdString);
          conditionResult = loginStreak >= (condition.value as number);
          this.logger.log(
            `LOGIN_STREAK: User Streak=${loginStreak}, Required=${condition.value}, Met=${conditionResult}`,
          );
          break;
        }
        case EventConditionType.FRIEND_INVITATION: {
          const invitationCount =
            await this.userActivityService.getFriendInvitationCount(
              userIdString,
            );
          conditionResult = invitationCount >= (condition.value as number);
          this.logger.log(
            `FRIEND_INVITATION: User Count=${invitationCount}, Required=${condition.value}, Met=${conditionResult}`,
          );
          break;
        }
        case EventConditionType.QUEST_CLEAR: {
          const questCleared = await this.userActivityService.hasClearedQuest(
            userIdString,
            condition.value as string,
          );
          conditionResult = questCleared;
          this.logger.log(
            `QUEST_CLEAR: User Cleared Quest ${String(condition.value)}=${questCleared}, Met=${conditionResult}`,
          );
          break;
        }
        case EventConditionType.MINIMUM_PURCHASE: {
          const purchaseAmount =
            await this.userActivityService.getMinimumPurchaseAmount(
              userIdString,
            );
          conditionResult = purchaseAmount >= (condition.value as number);
          this.logger.log(
            `MINIMUM_PURCHASE: User Purchase Amount=${purchaseAmount}, Required=${condition.value}, Met=${conditionResult}`,
          );
          break;
        }
        case EventConditionType.ALWAYS_TRUE: {
          conditionResult = true;
          this.logger.log(`ALWAYS_TRUE: Met=${conditionResult}`);
          break;
        }
        default: {
          const exhaustiveCheck: never = condition.type;
          this.logger.warn(
            `알 수 없는 조건 타입(default): ${String(exhaustiveCheck)}. 해당 조건은 실패로 간주.`,
          );
        }
      }
      if (!conditionResult) {
        this.logger.log(
          `조건 불충족: 타입=${condition.type}, 값=${String(condition.value)}. 전체 조건 검증 실패.`,
        );
        return false;
      }
      this.logger.debug(`조건 통과: 타입=${condition.type}`);
    }
    this.logger.log('모든 조건 충족. 검증 성공.');
    return true;
  }

  async findUserRequests(
    userId: string,
    eventId?: string,
  ): Promise<RewardRequestDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (eventId) {
      if (!Types.ObjectId.isValid(eventId))
        throw new BadRequestException('유효하지 않은 이벤트 ID 형식입니다.');
      query.eventId = new Types.ObjectId(eventId);
    }
    return this.rewardRequestModel
      .find(query)
      .sort({ requestedAt: -1 })
      .populate('eventId')
      .populate('rewardId')
      .exec();
  }

  async findAllRequests(
    eventId?: string,
    userId?: string,
    status?: RewardRequestStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: RewardRequestDocument[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const query: any = {};
    if (eventId) {
      if (!Types.ObjectId.isValid(eventId))
        throw new BadRequestException('유효하지 않은 이벤트 ID 형식입니다.');
      query.eventId = new Types.ObjectId(eventId);
    }
    if (userId) {
      if (!Types.ObjectId.isValid(userId))
        throw new BadRequestException('유효하지 않은 사용자 ID 형식입니다.');
      query.userId = new Types.ObjectId(userId);
    }
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await this.rewardRequestModel.countDocuments(query).exec();
    const data = await this.rewardRequestModel
      .find(query)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('eventId', 'title')
      .populate('rewardId', 'name type')
      .populate('userId', 'username')
      .exec();

    return {
      data,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneRequest(requestId: string): Promise<RewardRequestDocument> {
    if (!Types.ObjectId.isValid(requestId))
      throw new BadRequestException('유효하지 않은 요청 ID 형식입니다.');
    const request = await this.rewardRequestModel
      .findById(requestId)
      .populate<{ eventId: EventDocument | null }>('eventId')
      .populate<{ rewardId: RewardDocument | null }>('rewardId')
      .populate<{
        userId: { _id: Types.ObjectId; username: string } | null;
      }>('userId', 'username')
      .exec();

    if (!request) {
      throw new NotFoundException(
        `ID가 "${requestId}"인 보상 요청을 찾을 수 없습니다.`,
      );
    }
    return request as unknown as RewardRequestDocument;
  }

  async updateRequestStatus(
    requestId: string,
    dto: UpdateRewardRequestStatusDto,
    processorIdString: string,
  ): Promise<RewardRequestDocument> {
    this.logger.log(
      `Updating status for reward request ID: ${requestId} by processor ${processorIdString} to ${dto.status}`,
    );
    if (!processorIdString) {
      this.logger.error('updateRequestStatus: processorIdString is missing.');
      throw new InternalServerErrorException('처리자 ID를 확인할 수 없습니다.');
    }
    const request = await this.findOneRequest(requestId);

    if (
      request.status === RewardRequestStatus.COMPLETED ||
      request.status === RewardRequestStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `이미 ${request.status} 상태인 요청은 변경할 수 없습니다.`,
      );
    }

    request.status = dto.status;
    request.processedAt = new Date();
    request.processorId = new Types.ObjectId(processorIdString);
    if (dto.reason) {
      request.failureReason = dto.reason;
    }

    if (dto.status === RewardRequestStatus.COMPLETED) {
      let rewardToUpdateId: Types.ObjectId;
      if (request.rewardId instanceof Types.ObjectId) {
        rewardToUpdateId = request.rewardId;
      } else if (
        request.rewardId &&
        typeof request.rewardId === 'object' &&
        '_id' in request.rewardId
      ) {
        rewardToUpdateId = (request.rewardId as RewardDocument)._id;
      } else {
        this.logger.error(
          `Cannot extract ObjectId from request.rewardId: ${JSON.stringify(request.rewardId)}`,
        );
        throw new InternalServerErrorException(
          '보상 ID를 확인할 수 없어 지급에 실패했습니다.',
        );
      }

      const reward = await this.rewardModel.findById(rewardToUpdateId).exec();
      if (!reward)
        throw new InternalServerErrorException(
          '보상 정보를 찾을 수 없어 지급에 실패했습니다.',
        );

      if (reward.stock !== null) {
        if (reward.stock <= 0) {
          request.status = RewardRequestStatus.FAILED;
          request.failureReason = '재고 부족으로 지급 실패';
          await request.save();
          throw new ConflictException('보상 재고가 소진되었습니다.');
        }
        const stockUpdateResult = await this.rewardModel
          .updateOne(
            { _id: reward._id, stock: { $gt: 0 } },
            { $inc: { stock: -1 } },
          )
          .exec();

        if (stockUpdateResult.modifiedCount === 0) {
          request.status = RewardRequestStatus.FAILED;
          request.failureReason = '재고 차감 실패로 지급 보류';
          await request.save();
          throw new ConflictException(
            '재고 차감에 실패했습니다. 다시 시도해주세요.',
          );
        }
      }

      let userIdForLog: string;
      if (request.userId instanceof Types.ObjectId) {
        userIdForLog = request.userId.toHexString();
      } else if (
        request.userId &&
        typeof request.userId === 'object' &&
        '_id' in request.userId
      ) {
        userIdForLog = (
          request.userId as { _id: Types.ObjectId }
        )._id.toHexString();
      } else {
        userIdForLog = 'unknown_user_id_type_issue';
        this.logger.error(
          `Cannot extract ObjectId from request.userId: ${JSON.stringify(request.userId)}`,
        );
      }

      const rewardIdForLog = rewardToUpdateId.toHexString();
      this.logger.log(
        `보상 지급 처리: 사용자 ID ${userIdForLog}, 보상 ID ${rewardIdForLog}`,
      );
      request.transactionDetails = {
        message: '보상 지급 완료됨 (시뮬레이션)',
        paidAt: new Date(),
      };
    }

    return request.save();
  }
}
