import {
  AvailabilityType,
} from '../domain/enums/availability-type.enum';
import type {
  CreateSportTypeInput,
  SportType,
  UpdateSportTypeInput,
} from '../domain/entities/sport-type.entity';
import type { SportTypeCachePort } from '../ports/outbound/sport-type-cache.port';
import type { SportTypeRepositoryPort } from '../ports/outbound/sport-type-repository.port';
import {
  SportNameExistsError,
  SportTypeNotFoundError,
  SportTypeValidationError,
} from './errors/sport-type.errors';

const REQUIRED_FIELDS_MESSAGE =
  'Sport name, icon URL, and availability type are required.';

export class SportTypeUseCase {
  constructor(
    private readonly repository: SportTypeRepositoryPort,
    private readonly cache: SportTypeCachePort,
  ) {}

  async list(): Promise<readonly SportType[]> {
    try {
      const cachedSportTypes = await this.cache.getAll();
      if (cachedSportTypes) {
        return cachedSportTypes;
      }
    } catch {
      // Cache failures must not prevent reads from PostgreSQL.
    }

    const sportTypes = await this.repository.findAll();
    try {
      await this.cache.setAll(sportTypes);
    } catch {
      // Cache failures must not prevent reads from PostgreSQL.
    }
    return sportTypes;
  }

  async create(
    input: CreateSportTypeInput,
    actorId: string,
  ): Promise<SportType> {
    const normalizedInput = this.normalizeInput(input);
    const existingSportType = await this.repository.findByNormalizedName(
      this.normalizeName(normalizedInput.sportName),
    );
    if (existingSportType) {
      throw new SportNameExistsError();
    }

    const sportType = await this.repository.create(
      {
        ...normalizedInput,
        isActive: true,
        isKpiEligible: true,
      },
      actorId,
    );
    await this.invalidateListCache();
    return sportType;
  }

  async update(
    id: string,
    input: UpdateSportTypeInput,
    actorId: string,
  ): Promise<SportType> {
    const existingSportType = await this.repository.findById(id);
    if (!existingSportType) {
      throw new SportTypeNotFoundError();
    }

    const normalizedInput = this.normalizeInput(input);
    const duplicateSportType = await this.repository.findByNormalizedName(
      this.normalizeName(normalizedInput.sportName),
      id,
    );
    if (duplicateSportType) {
      throw new SportNameExistsError();
    }

    const sportType = await this.repository.update(
      id,
      normalizedInput,
      actorId,
    );
    await this.invalidateListCache();
    return sportType;
  }

  async setActive(
    id: string,
    isActive: boolean,
    actorId: string,
  ): Promise<SportType> {
    const existingSportType = await this.repository.findById(id);
    if (!existingSportType) {
      throw new SportTypeNotFoundError();
    }

    const sportType = await this.repository.setActive(id, isActive, actorId);
    await this.invalidateListCache();
    return sportType;
  }

  private normalizeInput(
    input: CreateSportTypeInput | UpdateSportTypeInput,
  ): UpdateSportTypeInput {
    const sportName = input.sportName?.trim();
    const sportIconUrl = input.sportIconUrl?.trim();
    const isAvailabilityTypeValid = Object.values(AvailabilityType).includes(
      input.availabilityType,
    );

    if (!sportName || !sportIconUrl || !isAvailabilityTypeValid) {
      throw new SportTypeValidationError(REQUIRED_FIELDS_MESSAGE);
    }

    let parsedIconUrl: URL;
    try {
      parsedIconUrl = new URL(sportIconUrl);
    } catch {
      throw new SportTypeValidationError('Sport icon must be a valid URL.');
    }

    const isHttpProtocol =
      parsedIconUrl.protocol === 'http:' || parsedIconUrl.protocol === 'https:';
    if (!isHttpProtocol) {
      throw new SportTypeValidationError(
        'Sport icon URL must use HTTP or HTTPS.',
      );
    }

    return {
      sportName,
      sportIconUrl,
      availabilityType: input.availabilityType,
    };
  }

  private normalizeName(sportName: string): string {
    return sportName.trim().toLocaleLowerCase('en-US');
  }

  private async invalidateListCache(): Promise<void> {
    try {
      await this.cache.invalidateAll();
    } catch {
      // A committed database write must remain successful if Redis is unavailable.
    }
  }
}
