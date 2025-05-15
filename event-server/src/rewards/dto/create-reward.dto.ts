import {
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
  IsMongoId,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { RewardType } from '../schemas/reward.schema';

export class CreateRewardDto {
  @IsMongoId({ message: '유효한 이벤트 ID 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이벤트 ID를 입력해주세요.' })
  eventId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEnum(RewardType, { message: '유효하지 않은 보상 타입입니다.' })
  @IsNotEmpty()
  type: RewardType;

  @IsNumber({}, { message: '수량은 숫자여야 합니다.' })
  @Min(1, { message: '수량은 1 이상이어야 합니다.' })
  quantity: number;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  @IsNumber({}, { message: '재고는 숫자여야 합니다.' })
  @Min(0, { message: '재고는 0 이상이어야 합니다.' })
  @IsOptional()
  stock?: number | null;
}
