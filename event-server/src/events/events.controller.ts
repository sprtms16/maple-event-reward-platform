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
  ParseEnumPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuthUser, AuthenticatedUser } from '../auth/auth-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { EventStatus } from './schemas/event.schema';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  create(
    @Body() createEventDto: CreateEventDto,
    @AuthUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.create(createEventDto, user.userId);
  }

  @Get()
  findAll(
    @Query(
      'status',
      new DefaultValuePipe(null),
      new ParseEnumPipe(EventStatus, { optional: true }),
    )
    status?: EventStatus,
    @Query('showDeleted', new DefaultValuePipe(false)) showDeleted?: boolean,
    @AuthUser() user?: AuthenticatedUser,
  ) {
    const canShowDeleted =
      user?.roles?.includes(UserRole.ADMIN) && showDeleted === true;
    return this.eventsService.findAll(status, canShowDeleted);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @AuthUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.update(id, updateEventDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  remove(@Param('id') id: string, @AuthUser() user: AuthenticatedUser) {
    return this.eventsService.remove(id, user.userId);
  }
}
