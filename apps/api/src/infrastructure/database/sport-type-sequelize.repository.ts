import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  col,
  fn,
  Op,
  UniqueConstraintError,
  where,
} from 'sequelize';
import type {
  CreateSportTypeInput,
  SportType,
  UpdateSportTypeInput,
} from '../../core/domain/entities/sport-type.entity';
import {
  SportNameExistsError,
  SportTypeNotFoundError,
} from '../../core/application/errors/sport-type.errors';
import type { SportTypeRepositoryPort } from '../../core/ports/outbound/sport-type-repository.port';
import { SportTypeModel } from './models/sport-type.model';

@Injectable()
export class SportTypeSequelizeRepository implements SportTypeRepositoryPort {
  constructor(
    @InjectModel(SportTypeModel)
    private readonly sportTypeModel: typeof SportTypeModel,
  ) {}

  async findAll(): Promise<readonly SportType[]> {
    const models = await this.sportTypeModel.findAll({
      order: [['sport_name', 'ASC']],
    });
    return models.map((model) => this.toSportType(model));
  }

  async findById(id: string): Promise<SportType | null> {
    const model = await this.sportTypeModel.findByPk(id);
    return model ? this.toSportType(model) : null;
  }

  async findByNormalizedName(
    normalizedName: string,
    excludeId?: string,
  ): Promise<SportType | null> {
    const conditions = [
      where(fn('LOWER', col('sport_name')), normalizedName),
    ];
    if (excludeId) {
      conditions.push(where(col('id'), { [Op.ne]: excludeId }) as never);
    }

    const model = await this.sportTypeModel.findOne({
      where: { [Op.and]: conditions },
    });
    return model ? this.toSportType(model) : null;
  }

  async create(
    input: CreateSportTypeInput,
    actorId: string,
  ): Promise<SportType> {
    const now = new Date();
    try {
      const model = await this.sportTypeModel.create({
        sportName: input.sportName,
        sportIconUrl: input.sportIconUrl,
        availabilityType: input.availabilityType,
        isActive: true,
        isKpiEligible: true,
        createdBy: actorId,
        createdDate: now,
        updatedBy: actorId,
        updatedDate: now,
        deletedBy: null,
        deletedDate: null,
      });
      return this.toSportType(model);
    } catch (error) {
      this.throwIfDuplicateName(error);
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateSportTypeInput,
    actorId: string,
  ): Promise<SportType> {
    const model = await this.sportTypeModel.findByPk(id);
    if (!model) {
      throw new SportTypeNotFoundError();
    }

    model.sportName = input.sportName;
    model.sportIconUrl = input.sportIconUrl;
    model.availabilityType = input.availabilityType;
    model.updatedBy = actorId;
    model.updatedDate = new Date();

    try {
      await model.save();
      return this.toSportType(model);
    } catch (error) {
      this.throwIfDuplicateName(error);
      throw error;
    }
  }

  async setActive(
    id: string,
    isActive: boolean,
    actorId: string,
  ): Promise<SportType> {
    const model = await this.sportTypeModel.findByPk(id);
    if (!model) {
      throw new SportTypeNotFoundError();
    }

    const now = new Date();
    model.isActive = isActive;
    model.updatedBy = actorId;
    model.updatedDate = now;
    model.deletedBy = isActive ? null : actorId;
    model.deletedDate = isActive ? null : now;
    await model.save();
    return this.toSportType(model);
  }

  private toSportType(model: SportTypeModel): SportType {
    return {
      id: model.id,
      sportName: model.sportName,
      sportIconUrl: model.sportIconUrl,
      availabilityType: model.availabilityType,
      isActive: model.isActive,
      isKpiEligible: model.isKpiEligible,
      createdBy: model.createdBy,
      createdDate: model.createdDate,
      updatedBy: model.updatedBy,
      updatedDate: model.updatedDate,
      deletedBy: model.deletedBy,
      deletedDate: model.deletedDate,
    };
  }

  private throwIfDuplicateName(error: unknown): void {
    if (error instanceof UniqueConstraintError) {
      throw new SportNameExistsError();
    }
  }
}
