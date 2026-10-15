import { AvailabilityType } from '../domain/enums/availability-type.enum';
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
import { SportTypeUseCase } from './sport-type.use-case';

const actorId = 'c929fd31-fdfc-4f26-a29b-b484d83cff31';
const sportTypeId = 'fb518e5c-f364-4655-bad3-6a591ae3e637';
const input: CreateSportTypeInput = {
  sportName: '  Badminton  ',
  sportIconUrl: 'https://assets.example.test/badminton.svg',
  availabilityType: AvailabilityType.BOTH,
};
const updateInput: UpdateSportTypeInput = {
  sportName: 'Badminton',
  sportIconUrl: 'https://assets.example.test/badminton.svg',
  availabilityType: AvailabilityType.BOTH,
};

const sportType: SportType = {
  id: sportTypeId,
  sportName: 'Badminton',
  sportIconUrl: input.sportIconUrl,
  availabilityType: AvailabilityType.BOTH,
  isActive: true,
  isKpiEligible: true,
  createdBy: actorId,
  createdDate: new Date('2026-10-15T00:00:00.000Z'),
  updatedBy: actorId,
  updatedDate: new Date('2026-10-15T00:00:00.000Z'),
  deletedBy: null,
  deletedDate: null,
};

describe('SportTypeUseCase', () => {
  let useCase: SportTypeUseCase;
  let repository: jest.Mocked<SportTypeRepositoryPort>;
  let cache: jest.Mocked<SportTypeCachePort>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([sportType]),
      findById: jest.fn().mockResolvedValue(sportType),
      findByNormalizedName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(sportType),
      update: jest.fn().mockResolvedValue(sportType),
      setActive: jest.fn().mockResolvedValue(sportType),
    };
    cache = {
      getAll: jest.fn().mockResolvedValue(null),
      setAll: jest.fn().mockResolvedValue(undefined),
      invalidateAll: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SportTypeUseCase(repository, cache);
  });

  it('returns the cached list without querying the repository', async () => {
    cache.getAll.mockResolvedValue([sportType]);

    await expect(useCase.list()).resolves.toEqual([sportType]);

    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('loads from the repository and caches the list after a cache miss', async () => {
    await expect(useCase.list()).resolves.toEqual([sportType]);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(cache.setAll).toHaveBeenCalledWith([sportType]);
  });

  it('falls back to the repository when reading the cache fails', async () => {
    cache.getAll.mockRejectedValue(new Error('Redis is unavailable'));

    await expect(useCase.list()).resolves.toEqual([sportType]);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('creates a normalized active KPI eligible sport type and invalidates the list', async () => {
    await useCase.create(input, actorId);

    expect(repository.create).toHaveBeenCalledWith(
      {
        sportName: 'Badminton',
        sportIconUrl: input.sportIconUrl,
        availabilityType: AvailabilityType.BOTH,
        isActive: true,
        isKpiEligible: true,
      },
      actorId,
    );
    expect(cache.invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('rejects a duplicate sport name without writing', async () => {
    repository.findByNormalizedName.mockResolvedValue(sportType);

    await expect(useCase.create(input, actorId)).rejects.toBeInstanceOf(
      SportNameExistsError,
    );

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects invalid required fields', async () => {
    await expect(
      useCase.create({ ...input, sportName: ' ' }, actorId),
    ).rejects.toBeInstanceOf(SportTypeValidationError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects updates for a missing sport type', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.update(sportTypeId, input, actorId),
    ).rejects.toBeInstanceOf(SportTypeNotFoundError);
  });

  it('rejects an update that duplicates another sport name', async () => {
    repository.findByNormalizedName.mockResolvedValue(sportType);

    await expect(
      useCase.update(sportTypeId, updateInput, actorId),
    ).rejects.toBeInstanceOf(SportNameExistsError);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('updates a sport type and invalidates the list', async () => {
    await useCase.update(sportTypeId, updateInput, actorId);

    expect(repository.update).toHaveBeenCalledWith(
      sportTypeId,
      updateInput,
      actorId,
    );
    expect(cache.invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('updates the status and invalidates the list', async () => {
    await useCase.setActive(sportTypeId, false, actorId);

    expect(repository.setActive).toHaveBeenCalledWith(
      sportTypeId,
      false,
      actorId,
    );
    expect(cache.invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('allows reactivating a sport type', async () => {
    await useCase.setActive(sportTypeId, true, actorId);

    expect(repository.setActive).toHaveBeenCalledWith(
      sportTypeId,
      true,
      actorId,
    );
    expect(cache.invalidateAll).toHaveBeenCalledTimes(1);
  });
});
