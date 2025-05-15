import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { RewardRequestStatus } from '../schemas/reward-request.schema';

export class UpdateRewardRequestStatusDto {
  @IsEnum(RewardRequestStatus, { message: '유효하지 않은 요청 상태입니다.' })
  @IsNotEmpty({ message: '요청 상태를 입력해주세요.' })
  status: RewardRequestStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
