import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { SportTypeUseCasePort } from '../src/core/ports/inbound/sport-type-use-case.port';
import { SPORT_TYPE_USE_CASE } from '../src/core/ports/inbound/sport-type-use-case.port';
import type { AuthenticationPort } from '../src/core/ports/outbound/authentication.port';
import { AUTHENTICATION_PORT } from '../src/core/ports/outbound/authentication.port';
import { AvailabilityType } from '../src/core/domain/enums/availability-type.enum';
import { SportNameExistsError, SportTypeNotFoundError } from '../src/core/application/errors/sport-type.errors';
import { AuthenticationGuard } from '../src/adapters/auth/authentication.guard';
import { RolesGuard } from '../src/adapters/auth/roles.guard';
import { DomainErrorFilter } from '../src/adapters/http/domain-error.filter';
import { MasterSportTypesController } from '../src/adapters/controllers/master-sport-types.controller';
import type { SportType } from '../src/core/domain/entities/sport-type.entity';

const ADMIN_ID = 'd3cbfce4-42ce-4bd4-a35a-67b4c38c3001';
const NOW = new Date('2026-10-15T00:00:00.000Z');

describe('Sport master data HTTP adapter (e2e)', () => {
  let app: INestApplication;
  const sports: SportType[] = [];
  const useCase: jest.Mocked<SportTypeUseCasePort> = {
    list: jest.fn(async () => [...sports]),
    create: jest.fn(async (input, actorId) => {
      if (sports.some((sport) => sport.sportName.toLowerCase() === input.sportName.toLowerCase())) {
        throw new SportNameExistsError();
      }
      const sport: SportType = {
        id: '0ac6af7a-05e4-44be-9ed8-1c9acfb7e188',
        sportName: input.sportName,
        sportIconUrl: input.sportIconUrl,
        availabilityType: input.availabilityType,
        isActive: true,
        isKpiEligible: true,
        createdBy: actorId,
        createdDate: NOW,
        updatedBy: actorId,
        updatedDate: NOW,
        deletedBy: null,
        deletedDate: null,
      };
      sports.push(sport);
      return sport;
    }),
    update: jest.fn(async (id, input, actorId) => {
      const index = sports.findIndex((sport) => sport.id === id);
      if (index < 0) throw new SportTypeNotFoundError();
      const updated = { ...sports[index], ...input, updatedBy: actorId, updatedDate: NOW };
      sports[index] = updated;
      return updated;
    }),
    setActive: jest.fn(async (id, isActive, actorId) => {
      const index = sports.findIndex((sport) => sport.id === id);
      if (index < 0) throw new SportTypeNotFoundError();
      const updated = {
        ...sports[index],
        isActive,
        updatedBy: actorId,
        updatedDate: NOW,
        deletedBy: isActive ? null : actorId,
        deletedDate: isActive ? null : NOW,
      };
      sports[index] = updated;
      return updated;
    }),
  };

  const authenticationPort: AuthenticationPort = {
    authenticate: jest.fn(async (token) => {
      if (token === 'admin-token') return { userId: ADMIN_ID, roles: ['ROLE_ADMIN_HRGA'] };
      if (token === 'employee-token') return { userId: ADMIN_ID, roles: ['ROLE_KARYAWAN'] };
      return null;
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MasterSportTypesController],
      providers: [
        AuthenticationGuard,
        RolesGuard,
        { provide: SPORT_TYPE_USE_CASE, useValue: useCase },
        { provide: AUTHENTICATION_PORT, useValue: authenticationPort },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: () => new BadRequestException({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: 'The request body is invalid.' },
        }),
      }),
    );
    app.useGlobalFilters(new DomainErrorFilter());
    await app.init();
  });

  beforeEach(() => {
    sports.length = 0;
    jest.clearAllMocks();
  });

  afterAll(async () => app.close());

  const admin = () => ({ Authorization: 'Bearer admin-token' });
  const validBody = {
    sportName: 'Badminton',
    sportIcon: 'https://example.test/badminton.svg',
    availabilityType: AvailabilityType.BOTH,
  };

  it('requires a token and rejects unknown tokens', async () => {
    await request(app.getHttpServer()).get('/sport/master/sports').expect(401);
    await request(app.getHttpServer())
      .get('/sport/master/sports')
      .set('Authorization', 'Bearer unknown')
      .expect(401);
  });

  it('rejects an authenticated employee without the HRGA role', async () => {
    await request(app.getHttpServer())
      .get('/sport/master/sports')
      .set('Authorization', 'Bearer employee-token')
      .expect(403);
  });

  it('lists sport types as Admin HRGA', async () => {
    const response = await request(app.getHttpServer())
      .get('/sport/master/sports')
      .set(admin())
      .expect(200);
    expect(response.body).toEqual({ success: true, data: [] });
  });

  it('creates, updates, and changes status as Admin HRGA', async () => {
    const created = await request(app.getHttpServer())
      .post('/sport/master/sports')
      .set(admin())
      .send(validBody)
      .expect(201);
    expect(created.body.data.isActive).toBe(true);
    expect(created.body.data.isKpiEligible).toBe(true);

    await request(app.getHttpServer())
      .put(`/sport/master/sports/${created.body.data.id}`)
      .set(admin())
      .send({ ...validBody, sportName: 'Badminton Indoor' })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/sport/master/sports/${created.body.data.id}/status`)
      .set(admin())
      .send({ isActive: false })
      .expect(200);
  });

  it('returns stable codes for validation, duplicate name, and missing ID errors', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/sport/master/sports')
      .set(admin())
      .send({ sportName: '', sportIcon: 'not-url', availabilityType: 'OTHER' })
      .expect(400);
    expect(invalid.body.error.code).toBe('VALIDATION_FAILED');

    await request(app.getHttpServer())
      .post('/sport/master/sports')
      .set(admin())
      .send(validBody)
      .expect(201);
    const duplicate = await request(app.getHttpServer())
      .post('/sport/master/sports')
      .set(admin())
      .send(validBody)
      .expect(409);
    expect(duplicate.body.error.code).toBe('SPORT_NAME_EXISTS');

    const missing = await request(app.getHttpServer())
      .put('/sport/master/sports/0ac6af7a-05e4-44be-9ed8-1c9acfb7e189')
      .set(admin())
      .send(validBody)
      .expect(404);
    expect(missing.body.error.code).toBe('SPORT_TYPE_NOT_FOUND');
  });
});
