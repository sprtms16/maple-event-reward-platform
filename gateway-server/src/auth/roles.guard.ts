import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger as NestLoggerRG,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { AuthenticatedUser } from './auth-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new NestLoggerRG(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user || !user.roles || !Array.isArray(user.roles)) {
      this.logger.warn(
        `RolesGuard: Access denied. User roles are missing or not an array. User: ${JSON.stringify(user)}`,
      );
      throw new ForbiddenException(
        '접근 권한이 없습니다 (사용자 역할 정보 누락).',
      );
    }

    this.logger.debug(
      `User roles: [${user.roles.join(', ')}], Required roles: [${requiredRoles.join(', ')}]`,
    );

    if (user.roles.includes('ADMIN')) {
      this.logger.debug(`ADMIN role detected. Access granted.`);
      return true;
    }

    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles.includes(role),
    );

    if (hasRequiredRole) {
      this.logger.debug(`User has required role. Access granted.`);
      return true;
    }

    this.logger.warn(
      `RolesGuard: Access denied. User does not have required roles. User: ${user.username}, Roles: ${user.roles.join(', ')}`,
    );
    throw new ForbiddenException(
      `이 작업을 수행하려면 다음 역할 중 하나가 필요합니다: ${requiredRoles.join(', ')}`,
    );
  }
}
