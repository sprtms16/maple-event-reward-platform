import {
  Injectable,
  UnauthorizedException,
  Logger as NestLoggerG,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from './auth-user.decorator';

interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new NestLoggerG(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    this.logger.debug(
      `Validating JWT payload for user: ${payload.username} (ID: ${payload.sub})`,
    );
    if (!payload.sub || !payload.username || !payload.roles) {
      this.logger.warn(
        `Invalid JWT payload structure for user: ${payload.username}`,
      );
      throw new UnauthorizedException('Invalid token payload structure.');
    }
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
