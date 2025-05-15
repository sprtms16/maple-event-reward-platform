import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger as NestLoggerJG,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new NestLoggerJG(JwtAuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context, status) {
    if (err || !user) {
      this.logger.warn(
        `JWT Auth Guard: Authentication failed. Info: ${info?.message || JSON.stringify(info)}, Error: ${err?.message || JSON.stringify(err)}`,
      );
      throw (
        err ||
        new UnauthorizedException(
          info?.message || '유효한 인증 토큰이 필요합니다.',
        )
      );
    }
    return user;
  }
}
