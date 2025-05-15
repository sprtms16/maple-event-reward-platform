import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '사용자 이름을 입력해주세요.' })
  username: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
