import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  roles: string[];
}

const logger = new Logger('AuthUserDecorator');

export const AuthUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedUser | string | string[] | undefined => {
    const request = ctx.switchToHttp().getRequest();

    const userId = request.headers['x-user-id'] as string;
    const username = request.headers['x-username'] as string;
    const rolesHeader = request.headers['x-user-roles'] as string;

    const passportUser = request.user as AuthenticatedUser;

    let user: AuthenticatedUser | undefined = undefined;

    if (userId && username && rolesHeader) {
      user = {
        userId,
        username,
        roles: rolesHeader.split(','),
      };
      logger.debug(`User context from headers: ${JSON.stringify(user)}`);
    } else if (passportUser && passportUser.userId) {
      user = passportUser;
      logger.debug(
        `User context from req.user (Passport): ${JSON.stringify(user)}`,
      );
    } else {
      logger.warn(
        `User context not found in headers or req.user for path: ${request.url}. Headers: ${JSON.stringify(request.headers)}`,
      );
    }

    if (
      !user &&
      (data === 'userId' || data === 'username' || data === 'roles')
    ) {
      logger.warn(`Requested field '${data}' but user object is undefined.`);
      return undefined;
    }

    return data ? user?.[data] : user;
  },
);
