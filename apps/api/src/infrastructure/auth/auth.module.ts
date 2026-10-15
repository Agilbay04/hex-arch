import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AUTHENTICATION_PORT } from '../../core/ports/outbound/authentication.port';
import { DevIamAdapter } from './dev-iam.adapter';

@Module({
  imports: [ConfigModule],
  providers: [
    DevIamAdapter,
    {
      provide: AUTHENTICATION_PORT,
      useFactory: (
        configService: ConfigService,
        devIamAdapter: DevIamAdapter,
      ) => {
        const nodeEnvironment = configService.get<string>(
          'NODE_ENV',
          'development',
        );
        const adapterName = configService.get<string>('AUTH_ADAPTER');
        if (nodeEnvironment === 'production' || adapterName !== 'dev-mock') {
          throw new Error(
            'A real IAM adapter is required outside development/test mode.',
          );
        }
        return devIamAdapter;
      },
      inject: [ConfigService, DevIamAdapter],
    },
  ],
  exports: [AUTHENTICATION_PORT],
})
export class AuthModule {}
