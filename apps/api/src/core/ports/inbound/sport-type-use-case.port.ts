import type {
  CreateSportTypeInput,
  SportType,
  UpdateSportTypeInput,
} from '../../domain/entities/sport-type.entity';

export interface SportTypeUseCasePort {
  list(): Promise<readonly SportType[]>;
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

export const SPORT_TYPE_USE_CASE = Symbol('SPORT_TYPE_USE_CASE');
