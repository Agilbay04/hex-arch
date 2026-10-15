import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SPORT_TYPE_CACHE } from '../../core/ports/outbound/sport-type-cache.port';
import { redisConfig } from './redis.config';
import { RedisSportTypeCacheAdapter } from './redis-sport-type-cache.adapter';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: RedisSportTypeCacheAdapter,
      useFactory: (configService: ConfigService) => new RedisSportTypeCacheAdapter(
        {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          username: configService.get<string | undefined>('redis.username'),
          password: configService.get<string | undefined>('redis.password'),
        },
        configService.get<number>('redis.ttlSeconds', 60),
      ),
      inject: [ConfigService],
    },
    {
      provide: SPORT_TYPE_CACHE,
      useExisting: RedisSportTypeCacheAdapter,
    },
  ],
  exports: [SPORT_TYPE_CACHE],
})
export class CacheModule {}
