import {
  IsString,
  IsDateString,
  IsArray,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EventStatus,
  EventConditionType,
  EventConditionDetail,
} from '../schemas/event.schema';

class EventConditionDetailDto implements EventConditionDetail {
  @IsEnum(EventConditionType, {
    message: '유효하지 않은 이벤트 조건 타입입니다.',
  })
  @IsNotEmpty({ message: '이벤트 조건 타입을 입력해주세요.' })
  type: EventConditionType;

  @IsNotEmpty({ message: '이벤트 조건 값을 입력해주세요.' })
  value: number | string | boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString({}, { message: '유효한 날짜 형식이 아닙니다 (ISO8601).' })
  @IsNotEmpty()
  startDate: string;

  @IsDateString({}, { message: '유효한 날짜 형식이 아닙니다 (ISO8601).' })
  @IsNotEmpty()
  endDate: string;

  @IsEnum(EventStatus, { message: '유효하지 않은 이벤트 상태입니다.' })
  @IsOptional()
  status?: EventStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventConditionDetailDto)
  @IsOptional()
  conditions?: EventConditionDetailDto[];
}
