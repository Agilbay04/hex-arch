import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  SportNameExistsError,
  SportTypeNotFoundError,
  SportTypeValidationError,
} from '../../core/application/errors/sport-type.errors';

type DomainError =
  | SportNameExistsError
  | SportTypeNotFoundError
  | SportTypeValidationError;

@Catch(
  SportNameExistsError,
  SportTypeNotFoundError,
  SportTypeValidationError,
)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = this.getStatusCode(exception);
    response.status(statusCode).json({
      success: false,
      error: {
        code: exception.code,
        message: exception.message,
      },
    });
  }

  private getStatusCode(exception: DomainError): HttpStatus {
    if (exception instanceof SportNameExistsError) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof SportTypeNotFoundError) {
      return HttpStatus.NOT_FOUND;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
