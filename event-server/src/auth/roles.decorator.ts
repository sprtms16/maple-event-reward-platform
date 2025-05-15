import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export enum UserRole {
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
}
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
