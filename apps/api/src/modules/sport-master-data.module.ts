import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SportTypeUseCase } from '../core/application/sport-type.use-case';
import type { SportTypeCachePort } from '../core/ports/outbound/sport-type-cache.port';
import type { SportTypeRepositoryPort } from '../core/ports/outbound/sport-type-repository.port';
import { SPORT_TYPE_USE_CASE } from '../core/ports/inbound/sport-type-use-case.port';
import { SPORT_TYPE_CACHE } from '../core/ports/outbound/sport-type-cache.port';
import { SPORT_TYPE_REPOSITORY } from '../core/ports/outbound/sport-type-repository.port';
import { AuthenticationGuard } from '../adapters/auth/authentication.guard';
import { RolesGuard } from '../adapters/auth/roles.guard';
import { DomainErrorFilter } from '../adapters/http/domain-error.filter';
import { MasterSportTypesController } from '../adapters/controllers/master-sport-types.controller';
import { CacheModule } from '../infrastructure/cache/cache.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { SportTypeModel } from '../infrastructure/database/models/sport-type.model';
import { SportTypeSequelizeRepository } from '../infrastructure/database/sport-type-sequelize.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([SportTypeModel]),
    CacheModule,
    AuthModule,
  ],
  controllers: [MasterSportTypesController],
  providers: [
    SportTypeSequelizeRepository,
    AuthenticationGuard,
    RolesGuard,
    DomainErrorFilter,
    {
      provide: SPORT_TYPE_USE_CASE,
      useFactory: (
        repository: SportTypeRepositoryPort,
        cache: SportTypeCachePort,
      ) => new SportTypeUseCase(repository, cache),
      inject: [SPORT_TYPE_REPOSITORY, SPORT_TYPE_CACHE],
    },
    {
      provide: SPORT_TYPE_REPOSITORY,
      useExisting: SportTypeSequelizeRepository,
    },
  ],
  exports: [SPORT_TYPE_REPOSITORY, SPORT_TYPE_USE_CASE],
})
export class SportMasterDataModule {}
