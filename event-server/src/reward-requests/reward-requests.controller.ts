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
} from '@nestjs/common';
import { RewardRequestsService } from './reward-requests.service';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { UpdateRewardRequestStatusDto } from './dto/update-reward-request-status.dto';
import { AuthUser, AuthenticatedUser } from '../auth/auth-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { RewardRequestStatus } from './schemas/reward-request.schema';

@Controller('reward-requests')
export class RewardRequestsController {
  constructor(private readonly rewardRequestsService: RewardRequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  create(
    @AuthUser() user: AuthenticatedUser,
    @Body() createDto: CreateRewardRequestDto,
  ) {
    return this.rewardRequestsService.createRequest(user.userId, createDto);
  }

  @Get('my-requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  findMyRequests(
    @AuthUser() user: AuthenticatedUser,
    @Query('eventId') eventId?: string,
  ) {
    return this.rewardRequestsService.findUserRequests(user.userId, eventId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.AUDITOR)
  findAll(
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
    const request = await this.rewardRequestsService.findOneRequest(id);

    const allowedRolesForViewing: string[] = [
      UserRole.ADMIN,
      UserRole.OPERATOR,
      UserRole.AUDITOR,
    ];
    const userHasViewingPermission = user.roles.some((userRoleString) =>
      allowedRolesForViewing.includes(userRoleString),
    );

    if (
      request.userId.toString() !== user.userId &&
      !userHasViewingPermission
    ) {
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
    return this.rewardRequestsService.updateRequestStatus(
      id,
      updateDto,
      user.userId,
    );
  }
}
