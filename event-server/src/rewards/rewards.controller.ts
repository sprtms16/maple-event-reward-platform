import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { AuthUser, AuthenticatedUser } from '../auth/auth-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  create(
    @Body() createRewardDto: CreateRewardDto,
    @AuthUser() user: AuthenticatedUser,
  ) {
    return this.rewardsService.create(createRewardDto, user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.AUDITOR)
  findAllByEvent(@Query('eventId') eventId?: string) {
    if (eventId) {
      return this.rewardsService.findAllByEventId(eventId);
    }
    throw new BadRequestException('eventId 쿼리 파라미터가 필요합니다.');
  }

  @Get('event/:eventId')
  findAllForEvent(@Param('eventId') eventId: string) {
    return this.rewardsService.findAllByEventId(eventId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rewardsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateRewardDto: UpdateRewardDto,
    @AuthUser() user: AuthenticatedUser,
  ) {
    return this.rewardsService.update(id, updateRewardDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  remove(@Param('id') id: string, @AuthUser() user: AuthenticatedUser) {
    return this.rewardsService.remove(id, user.userId);
  }
}
