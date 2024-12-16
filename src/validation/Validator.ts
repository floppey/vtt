import { Size } from "@/vtt/types/types";

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
