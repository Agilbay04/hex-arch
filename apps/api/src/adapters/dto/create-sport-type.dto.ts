import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';
import { AvailabilityType } from '../../core/domain/enums/availability-type.enum';

export class CreateSportTypeDto {
  @ApiProperty({ maxLength: 100, example: 'Badminton' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sportName!: string;

  @ApiProperty({ format: 'uri', example: 'https://example.com/badminton.svg' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  sportIcon!: string;

  @ApiProperty({ enum: AvailabilityType, example: AvailabilityType.BOTH })
  @IsEnum(AvailabilityType)
  availabilityType!: AvailabilityType;
}
