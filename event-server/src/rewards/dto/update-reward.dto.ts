import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardDto } from './create-reward.dto';
import { IsMongoId, IsOptional } from 'class-validator';

export class UpdateRewardDto extends PartialType(CreateRewardDto) {
  @IsOptional()
  @IsMongoId({ message: '유효한 이벤트 ID 형식이 아닙니다.' })
  eventId?: string;
}
