import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSportTypeStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive!: boolean;
}
