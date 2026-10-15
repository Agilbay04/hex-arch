import type { SportType } from '../../domain/entities/sport-type.entity';

export interface SportTypeCachePort {
  getAll(): Promise<readonly SportType[] | null>;
  setAll(sportTypes: readonly SportType[]): Promise<void>;
  invalidateAll(): Promise<void>;
}

export const SPORT_TYPE_CACHE = Symbol('SPORT_TYPE_CACHE');
