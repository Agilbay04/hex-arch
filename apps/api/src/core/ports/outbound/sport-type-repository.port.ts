import type {
  CreateSportTypeInput,
  SportType,
  UpdateSportTypeInput,
} from '../../domain/entities/sport-type.entity';

export interface SportTypeRepositoryPort {
  findAll(): Promise<readonly SportType[]>;
  findById(id: string): Promise<SportType | null>;
  findByNormalizedName(
    normalizedName: string,
    excludeId?: string,
  ): Promise<SportType | null>;
  create(input: CreateSportTypeInput, actorId: string): Promise<SportType>;
  update(
    id: string,
    input: UpdateSportTypeInput,
    actorId: string,
  ): Promise<SportType>;
  setActive(
    id: string,
    isActive: boolean,
    actorId: string,
  ): Promise<SportType>;
}

export const SPORT_TYPE_REPOSITORY = Symbol('SPORT_TYPE_REPOSITORY');
