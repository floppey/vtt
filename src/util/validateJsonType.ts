interface Validation {
  isValid: boolean;
  messages: string[];
}

export type TypeValidator<T> = {
  [K in keyof T]?: (value: T[K] | undefined) => boolean;
};

export const validateJsonType = <T extends object>(
  jsonString: string | null | undefined,
  // Use a type that includes type information
  typeValidator: TypeValidator<T>
): Validation => {
  const validation: Validation = {
    isValid: true,
    messages: [],
  };

  try {
    const parsed = JSON.parse(jsonString ?? "null");

    if (parsed === null || parsed === undefined) {
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

      // If the key is not in the parsed JSON, and it's required, fail
      if (!(key in parsed) && validator(parsed[key]) === false) {
        validation.isValid = false;
        validation.messages.push(`Missing required key: ${String(key)}`);
        return;
      }

      // Validate the value of the key
      if (validator(parsed[key]) === false) {
        validation.isValid = false;
        validation.messages.push(
          `Validation failed for key ${String(key)}: Invalid value "${
            parsed[key]
          }" (${typeof parsed[key]})`
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
