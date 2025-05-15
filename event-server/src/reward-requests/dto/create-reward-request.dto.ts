import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRewardRequestDto {
  @IsMongoId({ message: '유효한 이벤트 ID 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이벤트 ID를 입력해주세요.' })
  eventId: string;

  @IsMongoId({ message: '유효한 보상 ID 형식이 아닙니다.' })
  @IsNotEmpty({ message: '보상 ID를 입력해주세요.' })
  rewardId: string;

  @IsOptional()
  @IsString()
  userMemo?: string;
}
