import { Coordinates, GridPosition, Size } from "@/vtt/types/types";

export type ValidatorFunction<T> = (value: T | undefined) => boolean;

export type TypeValidator<T> = {
  [K in keyof T]?: Validator<T[K]>;
};

export interface Validation {
  isValid: boolean;
  messages: string[];
}

export class Validator<T> {
  #validations: ValidatorFunction<T | null | undefined>[] = [];
  #errorMessage: string = "Validation failed";

  constructor(errorMessage?: string) {
    if (errorMessage) {
      this.#errorMessage = errorMessage;
    }
  }

  isRequired(): this {
    this.#validations.push((value) => value !== undefined && value !== null);
    return this;
  }

  validate(value: T | undefined): boolean {
    return this.#validations.every((validator) => validator(value));
  }

  get errorMessage(): string {
    return this.#errorMessage;
  }

  addValidation(validator: ValidatorFunction<T | null | undefined>) {
    this.#validations.push(validator);
  }
}

export class StringValidator extends Validator<string> {
  constructor(errorMessage?: string) {
    super(errorMessage);
  }

  isString(optional = false): this {
    this.addValidation(
      (value) =>
        typeof value === "string" ||
        (optional && (value === undefined || value === null))
    );
    return this;
  }

  isRequired(): this {
    super.isRequired();
    this.addValidation(
      (value) => typeof value === "string" && value.trim() !== ""
    );
    return this;
  }

  matchesRegex(regex: RegExp): this {
    this.addValidation(
      (value) => typeof value === "string" && regex.test(value)
    );
    return this;
  }
}

export class NumberValidator extends Validator<number> {
  constructor(errorMessage?: string) {
    super(errorMessage);
  }

  isNumber(optional = false): this {
    this.addValidation(
      (value) =>
        typeof value === "number" ||
        (optional && (value === undefined || value === null))
    );
    return this;
  }

  isInteger(): this {
    this.addValidation((value) => Number.isInteger(value));
    return this;
  }

  isFloat(): this {
    this.addValidation((value) => !!value && value % 1 !== 0);
    return this;
  }

  isPositive(): this {
    this.addValidation((value) => !!value && value > 0);
    return this;
  }

  isNegative(): this {
    this.addValidation((value) => !!value && value < 0);
    return this;
  }
}

export class BooleanValidator extends Validator<boolean> {
  constructor(errorMessage?: string) {
    super(errorMessage);
  }

  isBoolean(optional = false): this {
    this.addValidation(
      (value) =>
        typeof value === "boolean" ||
        (optional && (value === undefined || value === null))
    );
    return this;
  }
}

export class SizeValidator extends Validator<Size> {
  constructor(errorMessage?: string) {
    super(errorMessage);
  }

  isSize(optional = false): this {
    this.addValidation(
      (value) =>
        (typeof value?.width === "number" &&
          typeof value?.height === "number") ||
        (optional && (value === undefined || value === null))
    );
    return this;
  }

  isValid(): this {
    this.addValidation(
      (value) => (value?.width ?? -1) > 0 && (value?.height ?? -1) > 0
    );
    return this;
  }
}

export class CoordinatesValidator extends Validator<Coordinates> {
  constructor(errorMessage?: string) {
    super(errorMessage);
  }

  isCoordinates(optional = false): this {
    this.addValidation(
      (value) =>
        (typeof value?.x === "number" && typeof value?.y === "number") ||
        (optional && (value === undefined || value === null))
    );
    return this;
  }
}

export class GridPositionValidator extends Validator<GridPosition> {
  constructor(errorMessage?: string) {
    super(errorMessage);
  }

  isGridPosition(optional = false): this {
    this.addValidation(
      (value) =>
        (typeof value?.col === "number" && typeof value?.row === "number") ||
        (optional && (value === undefined || value === null))
    );
    return this;
  }
}

export class ArrayValidator<T> extends Validator<T[]> {
  constructor(errorMessage?: string) {
    super(errorMessage);
  }

  isArray(optional = false): this {
    this.addValidation(
      (value) =>
        Array.isArray(value) ||
        (optional && (value === undefined || value === null))
    );
    return this;
  }

  isNotEmpty(): this {
    this.addValidation((value) => !!value && value.length > 0);
    return this;
  }

  hasLength(length: number): this {
    this.addValidation((value) => !!value && value.length === length);
    return this;
  }

  hasMinLength(length: number): this {
    this.addValidation((value) => !!value && value.length >= length);
    return this;
  }

  hasValidElements(validator: Validator<T>): this {
    this.addValidation(
      (value) =>
        !!value && value.every((element) => validator.validate(element))
    );
    return this;
  }
}

export class ObjectValidator<T> extends Validator<T> {
  #typeValidators: TypeValidator<T> = {};

  constructor(errorMessage?: string) {
    super(errorMessage);
  }

  addFieldValidator<K extends keyof T>(
    key: K,
    validator: Validator<T[K]>
  ): this {
    this.#typeValidators[key] = validator;
    return this;
  }

  validate(value: T | undefined): boolean {
    if (!super.validate(value)) {
      return false;
    }

    for (const key in this.#typeValidators) {
      if (this.#typeValidators.hasOwnProperty(key)) {
        if (typeof value !== "object" || value === null) {
          return false;
        }
        const validator = this.#typeValidators[key];
        if (validator && !validator.validate(value[key])) {
          return false;
        }
      }
    }

    return true;
  }
}
