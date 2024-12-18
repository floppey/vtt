import { TypeValidator, Validation } from "./Validator";

export const validateObject = <T extends object>(
  test: T,
  typeValidator: TypeValidator<T>
): Validation => {
  const validation: Validation = {
    isValid: true,
    messages: [],
  };

  try {
    if (test === null || test === undefined) {
      validation.isValid = false;
      validation.messages.push("JSON parsing failed");
      return validation;
    }

    // Check each property in the validator
    (Object.keys(typeValidator) as Array<keyof T>).forEach((key) => {
      const validator = typeValidator[key];
      if (!validator) {
        return;
      }

      const value = test[key];
      /* @ts-expect-error I can't find a way to type this properly, but this works. The problem is that keyof T is not the same as Exclude<T[keyof T], undefined> */
      if (!validator.validate(value)) {
        validation.isValid = false;
        validation.messages.push(
          `Validation failed for key ${String(key)}: ${validator.errorMessage}`
        );
      }
    });
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
