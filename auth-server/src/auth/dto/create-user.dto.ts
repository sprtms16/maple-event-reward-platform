import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  @MinLength(3, { message: '사용자 이름은 최소 3자 이상이어야 합니다.' })
  username: string;

  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @IsOptional()
  @IsArray({ message: '역할은 배열 형태여야 합니다.' })
  @ArrayNotEmpty({
    message: '역할 배열은 비어있을 수 없습니다 (선택 사항인 경우 제외).',
  })
  @ArrayUnique({ message: '역할 배열에 중복된 값이 있을 수 없습니다.' })
  @IsString({ each: true, message: '배열의 각 역할은 문자열이어야 합니다.' })
  roles?: string[];
}
