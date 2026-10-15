import Redis from 'ioredis';
import { RedisSportTypeCacheAdapter } from './redis-sport-type-cache.adapter';
import { AvailabilityType } from '../../core/domain/enums/availability-type.enum';
import type { SportType } from '../../core/domain/entities/sport-type.entity';

describe('RedisSportTypeCacheAdapter', () => {
  const sport: SportType = {
    id: '0ac6af7a-05e4-44be-9ed8-1c9acfb7e188',
    sportName: 'Badminton',
    sportIconUrl: 'https://example.test/badminton.svg',
    availabilityType: AvailabilityType.BOTH,
    isActive: true,
    isKpiEligible: true,
    createdBy: null,
    createdDate: new Date('2026-10-15T00:00:00.000Z'),
    updatedBy: null,
    updatedDate: new Date('2026-10-15T00:00:00.000Z'),
    deletedBy: null,
    deletedDate: null,
  };

  function createAdapter() {
    const client = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      quit: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Redis;
    return {
      adapter: new RedisSportTypeCacheAdapter({ host: 'localhost', port: 6379 }, 60, client),
      client,
    };
  }

  it('returns null when the list is not cached', async () => {
    const { adapter, client } = createAdapter();
    jest.mocked(client.get).mockResolvedValue(null);
    await expect(adapter.getAll()).resolves.toBeNull();
  });

  it('restores date fields when reading a cached list', async () => {
    const { adapter, client } = createAdapter();
    jest.mocked(client.get).mockResolvedValue(JSON.stringify([sport]));
    const result = await adapter.getAll();
    expect(result?.[0].createdDate).toEqual(sport.createdDate);
    expect(result?.[0].updatedDate).toEqual(sport.updatedDate);
    expect(result?.[0].createdDate).toBeInstanceOf(Date);
  });

  it('returns null when Redis read fails', async () => {
    const { adapter, client } = createAdapter();
    jest.mocked(client.get).mockRejectedValue(new Error('Redis down'));
    await expect(adapter.getAll()).resolves.toBeNull();
  });

  it('writes the list with the finite TTL and deletes the same key', async () => {
    const { adapter, client } = createAdapter();
    jest.mocked(client.set).mockResolvedValue('OK');
    jest.mocked(client.del).mockResolvedValue(1);
    await adapter.setAll([sport]);
    expect(client.set).toHaveBeenCalledWith(
      'iss-sport:master-sports:v1',
      JSON.stringify([sport]),
      'EX',
      60,
    );
    await adapter.invalidateAll();
    expect(client.del).toHaveBeenCalledWith('iss-sport:master-sports:v1');
  });
});
