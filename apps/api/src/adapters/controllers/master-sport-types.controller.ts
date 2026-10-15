import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../core/ports/outbound/authentication.port';
import {
  SPORT_TYPE_USE_CASE,
  type SportTypeUseCasePort,
} from '../../core/ports/inbound/sport-type-use-case.port';
import { AvailabilityType } from '../../core/domain/enums/availability-type.enum';
import { AuthenticationGuard } from '../auth/authentication.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateSportTypeDto } from '../dto/create-sport-type.dto';
import { UpdateSportTypeDto } from '../dto/update-sport-type.dto';
import { UpdateSportTypeStatusDto } from '../dto/update-sport-type-status.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedPrincipal };

type SportTypeResponse = {
  id: string;
  sportName: string;
  sportIcon: string;
  availabilityType: AvailabilityType;
  isActive: boolean;
  isKpiEligible: boolean;
  createdDate: Date;
  updatedDate: Date;
};

@ApiTags('Sport Master Data')
@ApiBearerAuth()
@Controller('sport/master/sports')
@UseGuards(AuthenticationGuard, RolesGuard)
@Roles('ROLE_ADMIN_HRGA')
export class MasterSportTypesController {
  constructor(
    @Inject(SPORT_TYPE_USE_CASE)
    private readonly sportTypeUseCase: SportTypeUseCasePort,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Returns all sport types.' })
  async list(): Promise<{ success: true; data: SportTypeResponse[] }> {
    const sportTypes = await this.sportTypeUseCase.list();
    return { success: true, data: sportTypes.map((item) => this.toResponse(item)) };
  }

  @Post()
  @ApiCreatedResponse({ description: 'Creates a sport type.' })
  async create(
    @Body() body: CreateSportTypeDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: true; data: SportTypeResponse }> {
    const sportType = await this.sportTypeUseCase.create(
      {
        sportName: body.sportName,
        sportIconUrl: body.sportIcon,
        availabilityType: body.availabilityType,
        isActive: true,
        isKpiEligible: true,
      },
      request.user.userId,
    );
    return { success: true, data: this.toResponse(sportType) };
  }

  @Put(':id')
  @ApiOkResponse({ description: 'Updates a sport type.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSportTypeDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: true; data: SportTypeResponse }> {
    const sportType = await this.sportTypeUseCase.update(
      id,
      {
        sportName: body.sportName,
        sportIconUrl: body.sportIcon,
        availabilityType: body.availabilityType,
      },
      request.user.userId,
    );
    return { success: true, data: this.toResponse(sportType) };
  }

  @Put(':id/status')
  @ApiOkResponse({ description: 'Activates or deactivates a sport type.' })
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSportTypeStatusDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: true; data: SportTypeResponse }> {
    const sportType = await this.sportTypeUseCase.setActive(
      id,
      body.isActive,
      request.user.userId,
    );
    return { success: true, data: this.toResponse(sportType) };
  }

  private toResponse(sportType: Awaited<ReturnType<SportTypeUseCasePort['create']>>): SportTypeResponse {
    return {
      id: sportType.id,
      sportName: sportType.sportName,
      sportIcon: sportType.sportIconUrl,
      availabilityType: sportType.availabilityType,
      isActive: sportType.isActive,
      isKpiEligible: sportType.isKpiEligible,
      createdDate: sportType.createdDate,
      updatedDate: sportType.updatedDate,
    };
  }
}
