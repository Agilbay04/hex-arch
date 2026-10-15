import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../core/ports/outbound/authentication.port';
import { AUTHENTICATION_PORT } from '../../core/ports/outbound/authentication.port';
import type { AuthenticationPort } from '../../core/ports/outbound/authentication.port';

type AuthenticatedRequest = Request & { user?: AuthenticatedPrincipal };

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    @Inject(AUTHENTICATION_PORT)
    private readonly authenticationPort: AuthenticationPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;
    const bearerMatch = authorizationHeader?.match(/^Bearer\s+([^\s]+)$/i);
    if (!bearerMatch) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Provide a valid Bearer token to continue.',
        },
      });
    }

    const principal = await this.authenticationPort.authenticate(bearerMatch[1]);
    if (!principal) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'The provided token is invalid. Check the token and try again.',
        },
      });
    }

    request.user = principal;
    return true;
  }
}
