import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseEnumPipe,
  ForbiddenException as NestForbiddenException,
  Logger as RRControllerLogger,
  InternalServerErrorException as NestInternalServerErrorException,
} from '@nestjs/common';
import { RewardRequestsService } from './reward-requests.service';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { UpdateRewardRequestStatusDto } from './dto/update-reward-request-status.dto';
import { AuthUser, AuthenticatedUser } from '../auth/auth-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { RewardRequestStatus } from './schemas/reward-request.schema';
import { Types } from 'mongoose';

@Controller('reward-requests')
export class RewardRequestsController {
  private readonly logger = new RRControllerLogger(
    RewardRequestsController.name,
  );

  constructor(private readonly rewardRequestsService: RewardRequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  create(
    @AuthUser() user: AuthenticatedUser,
    @Body() createDto: CreateRewardRequestDto,
  ) {
    this.logger.log(
      `User ${user?.username} (ID: ${user?.userId}) attempting to create reward request: ${JSON.stringify(createDto)}`,
    );
    if (!user || !user.userId) {
      throw new NestForbiddenException(
        '사용자 정보를 확인할 수 없어 보상을 요청할 수 없습니다.',
      );
    }
    return this.rewardRequestsService.createRequest(user.userId, createDto);
  }

  @Get('my-requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  findMyRequests(
    @AuthUser() user: AuthenticatedUser,
    @Query('eventId') eventId?: string,
  ) {
    this.logger.debug(
      `User ${user?.username} (ID: ${user?.userId}) finding their reward requests. EventId: ${eventId}`,
    );
    if (!user || !user.userId) {
      throw new NestForbiddenException(
        '사용자 정보를 확인할 수 없어 요청을 조회할 수 없습니다.',
      );
    }
    return this.rewardRequestsService.findUserRequests(user.userId, eventId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.AUDITOR)
  findAll(
    @AuthUser() adminUser: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('eventId') eventId?: string,
    @Query('userId') userId?: string,
    @Query(
      'status',
      new DefaultValuePipe(null),
      new ParseEnumPipe(RewardRequestStatus, { optional: true }),
    )
    status?: RewardRequestStatus,
  ) {
    this.logger.debug(
      `Admin/Operator ${adminUser?.username} finding all reward requests with filters - Page: ${page}, Limit: ${limit}, EventId: ${eventId}, UserId: ${userId}, Status: ${status}`,
    );
    return this.rewardRequestsService.findAllRequests(
      eventId,
      userId,
      status,
      page,
      limit,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  async findOne(@Param('id') id: string, @AuthUser() user: AuthenticatedUser) {
    this.logger.debug(
      `User ${user?.username} (ID: ${user?.userId}) attempting to find reward request with ID: ${id}`,
    );
    if (!user || !user.userId) {
      throw new NestForbiddenException(
        '사용자 정보를 확인할 수 없어 요청을 조회할 수 없습니다.',
      );
    }
    const request = await this.rewardRequestsService.findOneRequest(id);

    const allowedRolesForViewing: string[] = [
      UserRole.ADMIN,
      UserRole.OPERATOR,
      UserRole.AUDITOR,
    ];
    const userHasViewingPermission = user.roles.some((userRoleString) =>
      allowedRolesForViewing.includes(userRoleString),
    );

    let requestUserIdString: string;
    if (request.userId instanceof Types.ObjectId) {
      requestUserIdString = request.userId.toHexString();
    } else if (
      request.userId &&
      typeof request.userId === 'object' &&
      '_id' in request.userId &&
      (request.userId as any)._id instanceof Types.ObjectId
    ) {
      requestUserIdString = (request.userId as any)._id.toHexString();
    } else {
      this.logger.error(
        `Could not determine userId string from populated request.userId for request ${request._id}. request.userId: ${JSON.stringify(request.userId)}`,
      );
      throw new NestInternalServerErrorException(
        '요청의 사용자 ID를 확인할 수 없습니다.',
      );
    }

    if (requestUserIdString !== user.userId && !userHasViewingPermission) {
      this.logger.warn(
        `User ${user.username} (ID: ${user.userId}) denied access to reward request ID: ${id}. Not owner or permitted role.`,
      );
      throw new NestForbiddenException('이 요청을 조회할 권한이 없습니다.');
    }
    return request;
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateRewardRequestStatusDto,
    @AuthUser() user: AuthenticatedUser,
  ) {
    this.logger.log(
      `User ${user?.username} (ID: ${user?.userId}) attempting to update status for reward request ID: ${id} to ${updateDto.status}`,
    );
    if (!user || !user.userId) {
      throw new NestForbiddenException(
        '사용자 정보를 확인할 수 없어 요청 상태를 변경할 수 없습니다.',
      );
    }
    return this.rewardRequestsService.updateRequestStatus(
      id,
      updateDto,
      user.userId,
    );
  }
}
