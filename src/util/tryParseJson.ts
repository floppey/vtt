import { validateJson } from "@/validation/validateJson";
import { TypeValidator } from "@/validation/Validator";

export const tryParseJson = <T>(
  jsonString: string | null | undefined,
  validator: TypeValidator<T>,
  defaultValue?: T
): T | null => {
  const validation = validateJson(jsonString, validator);
  if (validation.isValid) {
    return JSON.parse(jsonString!) as T;
  }
  return defaultValue ?? null;
};
