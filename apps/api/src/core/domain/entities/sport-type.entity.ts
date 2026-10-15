import { AvailabilityType } from '../enums/availability-type.enum';

export type SportType = Readonly<{
  id: string;
  sportName: string;
  sportIconUrl: string;
  availabilityType: AvailabilityType;
  isActive: boolean;
  isKpiEligible: boolean;
  createdBy: string | null;
  createdDate: Date;
  updatedBy: string | null;
  updatedDate: Date;
  deletedBy: string | null;
  deletedDate: Date | null;
}>;

export type CreateSportTypeInput = Readonly<{
  sportName: string;
  sportIconUrl: string;
  availabilityType: AvailabilityType;
  isActive: true;
  isKpiEligible: true;
}>;

export type UpdateSportTypeInput = Readonly<{
  sportName: string;
  sportIconUrl: string;
  availabilityType: AvailabilityType;
}>;
