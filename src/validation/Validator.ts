import { Coordinates, GridPosition, Size } from "@/vtt/types/types";

export type ValidatorFunction<T> = (value: T | undefined) => boolean;

export type TypeValidator<T> = {
  [K in keyof T]?: Validator<T[K]>;
};

export interface Validation {
  isValid: boolean;
  messages: string[];
}

interface ValidatorOptions {
  errorMessage?: string;
  isOptional?: boolean;
}

export class Validator<T> {
  #validations: ValidatorFunction<T | null | undefined>[] = [];
  #errorMessage: string = "Validation failed";
  #isOptional;

  constructor(props?: ValidatorOptions) {
    if (props?.errorMessage) {
      this.#errorMessage = props?.errorMessage;
    }
    this.#isOptional = Boolean(props?.isOptional);
  }

  validate(value: T | undefined): boolean {
    if (this.#isOptional && (value === undefined || value === null)) {
      return true;
    }
    return (
      value !== null &&
      value !== undefined &&
      this.#validations.every((validator) => validator(value))
    );
  }

  get errorMessage(): string {
    return this.#errorMessage;
  }

  addValidation(validator: ValidatorFunction<T | null | undefined>) {
    this.#validations.push(validator);
  }
}

export class StringValidator extends Validator<string> {
  isString(): this {
    this.addValidation((value) => typeof value === "string");
    return this;
  }

  isNotEmpty(): this {
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

  /**
   * Validates a string as a hex color code, with or without the leading #
   * @param optional set this to true if the value can be undefined or null
   * @returns true if the value is a hex color code string
   */
  isHexColor(): this {
    return this.matchesRegex(
      /^#?([a-f0-9]{3}|[a-f0-9]{6}|[a-f0-9]{4}|[a-f0-9]{8})$/i
    );
  }
}

export class NumberValidator extends Validator<number> {
  isNumber(): this {
    this.addValidation((value) => typeof value === "number");
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
  isBoolean(): this {
    this.addValidation((value) => typeof value === "boolean");
    return this;
  }
}

export class SizeValidator extends Validator<Size> {
  isSize(): this {
    this.addValidation(
      (value) =>
        typeof value?.width === "number" && typeof value?.height === "number"
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
  isCoordinates(): this {
    this.addValidation(
      (value) => typeof value?.x === "number" && typeof value?.y === "number"
    );
    return this;
  }
}

export class GridPositionValidator extends Validator<GridPosition> {
  isGridPosition(): this {
    this.addValidation(
      (value) =>
        typeof value?.col === "number" && typeof value?.row === "number"
    );
    return this;
  }
}

export class ArrayValidator<T> extends Validator<T[]> {
  isArray(): this {
    this.addValidation((value) => Array.isArray(value));
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
    this.addValidation((value) =>
      // !!value && value.every((element) => validator.validate(element))
      {
        if (!value) {
          return false;
        }
        for (const element of value) {
          if (!validator.validate(element)) {
            console.error("Failed validation", element);
            return false;
          }
        }
        return true;
      }
    );
    return this;
  }
}

export class ObjectValidator<T> extends Validator<T> {
  #typeValidators: TypeValidator<T> = {};

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
