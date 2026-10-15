import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import type { SportType } from '../../core/domain/entities/sport-type.entity';
import type { SportTypeCachePort } from '../../core/ports/outbound/sport-type-cache.port';

const SPORT_TYPES_KEY = 'iss-sport:master-sports:v1';

@Injectable()
export class RedisSportTypeCacheAdapter implements SportTypeCachePort {
  private readonly logger = new Logger(RedisSportTypeCacheAdapter.name);
  private readonly client: Redis;

  constructor(
    redisOptions: RedisOptions,
    private readonly ttlSeconds = 60,
    client?: Redis,
  ) {
    this.client = client ?? new Redis({
      ...redisOptions,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
  }

  async getAll(): Promise<readonly SportType[] | null> {
    try {
      const value = await this.client.get(SPORT_TYPES_KEY);
      if (!value) return null;

      const sportTypes = JSON.parse(value) as Array<
        Omit<SportType, 'createdDate' | 'updatedDate' | 'deletedDate'> & {
          createdDate: string;
          updatedDate: string;
          deletedDate: string | null;
        }
      >;
      return sportTypes.map((item) => ({
        ...item,
        createdDate: new Date(item.createdDate),
        updatedDate: new Date(item.updatedDate),
        deletedDate: item.deletedDate ? new Date(item.deletedDate) : null,
      }));
    } catch (error) {
      this.logger.warn(`Redis cache read failed: ${this.errorMessage(error)}`);
      return null;
    }
  }

  async setAll(sportTypes: readonly SportType[]): Promise<void> {
    try {
      await this.client.set(
        SPORT_TYPES_KEY,
        JSON.stringify(sportTypes),
        'EX',
        this.ttlSeconds,
      );
    } catch (error) {
      this.logger.warn(`Redis cache write failed: ${this.errorMessage(error)}`);
    }
  }

  async invalidateAll(): Promise<void> {
    try {
      await this.client.del(SPORT_TYPES_KEY);
    } catch (error) {
      this.logger.warn(`Redis cache invalidation failed: ${this.errorMessage(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'ready') {
      await this.client.quit().catch(() => this.client.disconnect());
      return;
    }
    this.client.disconnect();
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error';
  }
}
