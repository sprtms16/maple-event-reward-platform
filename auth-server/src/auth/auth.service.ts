import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { UserDocument, User } from '../users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<Omit<UserDocument, 'password_hash'>> {
    const { username, email, password, roles } = createUserDto;

    const existingUserByUsername =
      await this.usersService.findOneByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('이미 사용 중인 사용자 이름입니다.');
    }
    const existingUserByEmail = await this.usersService.findOneByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = new this.userModel({
        username,
        email,
        password_hash: hashedPassword,
        roles: roles || ['USER'],
      });
      const savedUser = await newUser.save();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = savedUser.toObject();
      return result as unknown as Omit<UserDocument, 'password_hash'>;
    } catch (error) {
      console.error('Error during user registration:', error);
      throw new InternalServerErrorException(
        '사용자 등록 중 오류가 발생했습니다.',
      );
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<{
    accessToken: string;
    user: Omit<UserDocument, 'password_hash'>;
  }> {
    const { username, password } = loginUserDto;
    const user = await this.usersService.findOneByUsername(username);

    if (!user) {
      throw new UnauthorizedException(
        '사용자 이름 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const isPasswordMatching: boolean = await user.comparePassword(password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException(
        '사용자 이름 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    await this.usersService.updateUserLastLogin(user._id.toString());

    const payload = {
      username: user.username,
      sub: user._id.toString(),
      roles: user.roles,
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userResult } = user.toObject();

    return {
      accessToken: this.jwtService.sign(payload),
      user: userResult as Omit<UserDocument, 'password_hash'>,
    };
  }

  async validateUserByIdForJwt(userId: string): Promise<UserDocument | null> {
    return this.usersService.findById(userId);
  }
}
