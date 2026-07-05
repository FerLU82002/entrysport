import { SetMetadata } from '@nestjs/common';

export type Rol = 'usuario' | 'admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
