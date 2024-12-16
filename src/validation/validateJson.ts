import { validateObject } from "./validateObject";
import { TypeValidator, Validation } from "./Validator";

export const validateJson = <T extends object>(
  jsonString: string | null | undefined,
  typeValidator: TypeValidator<T>
): Validation => {
  let validation: Validation = {
    isValid: true,
    messages: [],
  };

  try {
    const parsed = JSON.parse(jsonString ?? "null");

    validation = validateObject(parsed, typeValidator);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        isValid: false,
        messages: [error.message],
      };
    }
    if (typeof error === "string") {
      return {
        isValid: false,
        messages: [error],
      };
    }
    return {
      isValid: false,
      messages: ["An unknown error occurred"],
    };
  }

  return validation;
};
