import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import type { Optional } from 'sequelize';
import type { SportType } from '../../../core/domain/entities/sport-type.entity';
import { AvailabilityType } from '../../../core/domain/enums/availability-type.enum';

@Table({ tableName: 'master_sport_types', timestamps: false })
export class SportTypeModel extends Model<
  SportType,
  Optional<SportType, 'id'>
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: true, field: 'created_by' })
  declare createdBy: string | null;

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_date' })
  declare createdDate: Date;

  @Column({ type: DataType.UUID, allowNull: true, field: 'updated_by' })
  declare updatedBy: string | null;

  @Column({ type: DataType.DATE, allowNull: false, field: 'updated_date' })
  declare updatedDate: Date;

  @Column({ type: DataType.UUID, allowNull: true, field: 'deleted_by' })
  declare deletedBy: string | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_date' })
  declare deletedDate: Date | null;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'sport_name' })
  declare sportName: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'sport_icon_url' })
  declare sportIconUrl: string;

  @Column({
    type: DataType.ENUM(...Object.values(AvailabilityType)),
    allowNull: false,
    field: 'availability_type',
  })
  declare availabilityType: AvailabilityType;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false, field: 'is_active' })
  declare isActive: boolean;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'is_kpi_eligible',
  })
  declare isKpiEligible: boolean;
}
