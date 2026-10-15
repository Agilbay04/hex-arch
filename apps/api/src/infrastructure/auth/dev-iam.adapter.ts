import { createHash, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedPrincipal, AuthenticationPort } from '../../core/ports/outbound/authentication.port';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class DevIamAdapter implements AuthenticationPort {
  private readonly adminToken: string;
  private readonly adminUserId: string;
  private readonly employeeToken: string;
  private readonly employeeUserId: string;

  constructor(configService: ConfigService) {
    this.adminToken = configService.getOrThrow<string>('DEV_IAM_ADMIN_TOKEN');
    this.adminUserId = configService.getOrThrow<string>('DEV_IAM_ADMIN_USER_ID');
    this.employeeToken = configService.getOrThrow<string>(
      'DEV_IAM_KARYAWAN_TOKEN',
    );
    this.employeeUserId = configService.getOrThrow<string>(
      'DEV_IAM_KARYAWAN_USER_ID',
    );

    this.validateConfiguration();
  }

  async authenticate(token: string): Promise<AuthenticatedPrincipal | null> {
    if (this.matchesToken(token, this.adminToken)) {
      return { userId: this.adminUserId, roles: ['ROLE_ADMIN_HRGA'] };
    }
    if (this.matchesToken(token, this.employeeToken)) {
      return { userId: this.employeeUserId, roles: ['ROLE_KARYAWAN'] };
    }
    return null;
  }

  private validateConfiguration(): void {
    const nodeEnvironment = process.env.NODE_ENV ?? 'development';
    if (nodeEnvironment === 'production') {
      throw new Error('The development IAM adapter cannot run in production.');
    }

    const hasEmptyTokens = !this.adminToken.trim() || !this.employeeToken.trim();
    if (hasEmptyTokens) {
      throw new Error('Both development IAM tokens must be configured.');
    }

    const hasInvalidUserIds =
      !UUID_PATTERN.test(this.adminUserId) ||
      !UUID_PATTERN.test(this.employeeUserId);
    if (hasInvalidUserIds) {
      throw new Error('Development IAM user IDs must be valid UUIDs.');
    }

    if (this.tokensMatch(this.adminToken, this.employeeToken)) {
      throw new Error('Development IAM tokens must be different.');
    }
  }

  private matchesToken(candidate: string, expected: string): boolean {
    if (!candidate) {
      return false;
    }
    return this.tokensMatch(candidate, expected);
  }

  private tokensMatch(left: string, right: string): boolean {
    const leftDigest = createHash('sha256').update(left).digest();
    const rightDigest = createHash('sha256').update(right).digest();
    return timingSafeEqual(leftDigest, rightDigest);
  }
}
