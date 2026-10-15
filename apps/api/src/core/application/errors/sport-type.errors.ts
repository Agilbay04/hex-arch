export class SportTypeValidationError extends Error {
  readonly code = 'VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = SportTypeValidationError.name;
  }
}

export class SportNameExistsError extends Error {
  readonly code = 'SPORT_NAME_EXISTS';

  constructor() {
    super('A sport type with this name already exists. Choose a different name.');
    this.name = SportNameExistsError.name;
  }
}

export class SportTypeNotFoundError extends Error {
  readonly code = 'SPORT_TYPE_NOT_FOUND';

  constructor() {
    super('Sport type not found. Check the ID and try again.');
    this.name = SportTypeNotFoundError.name;
  }
}
