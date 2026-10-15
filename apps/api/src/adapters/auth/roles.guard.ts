import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../core/ports/outbound/authentication.port';
import { REQUIRED_ROLES } from './roles.decorator';

type AuthenticatedRequest = Request & { user?: AuthenticatedPrincipal };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ROLES,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const hasRequiredRole = requiredRoles.some((role) =>
      request.user?.roles.includes(role),
    );
    if (!hasRequiredRole) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'ROLE_FORBIDDEN',
          message: 'Your account does not have permission to perform this action.',
        },
      });
    }

    return true;
  }
}
