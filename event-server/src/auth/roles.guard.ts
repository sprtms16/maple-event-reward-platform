import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger as RolesGuardLogger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new RolesGuardLogger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userIdFromHeader = request.headers['x-user-id'] as string;
    const rolesFromHeader = request.headers['x-user-roles'] as string;

    if (!userIdFromHeader || !rolesFromHeader) {
      this.logger.warn(
        `RolesGuard: Access denied. User ID or roles missing in headers. Path: ${request.url}`,
      );
      throw new ForbiddenException(
        '접근 권한이 없습니다 (인증 정보 헤더 누락).',
      );
    }

    const userRoles: string[] = rolesFromHeader.split(',');

    this.logger.debug(
      `RolesGuard: User roles from header: [${userRoles.join(', ')}], Required roles: [${requiredRoles.join(', ')}] for path: ${request.url}`,
    );

    if (userRoles.includes(UserRole.ADMIN as string)) {
      this.logger.debug(
        `RolesGuard: ADMIN role detected. Access granted to ${request.url}.`,
      );
      return true;
    }

    const hasRequiredRole = requiredRoles.some((roleEnumMember: UserRole) =>
      userRoles.includes(roleEnumMember as string),
    );

    if (hasRequiredRole) {
      this.logger.debug(
        `RolesGuard: User has required role. Access granted to ${request.url}.`,
      );
      return true;
    }

    this.logger.warn(
      `RolesGuard: Access denied for user with roles [${userRoles.join(', ')}] to path ${request.url}. Required: [${requiredRoles.join(', ')}]`,
    );
    throw new ForbiddenException(
      `이 작업을 수행하려면 다음 역할 중 하나가 필요합니다: ${requiredRoles.join(', ')}`,
    );
  }
}
