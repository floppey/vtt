import { TypeValidator, validateJsonType } from "@/util/validateJsonType";

export const tryParseJson = <T>(
  jsonString: string | null | undefined,
  validator: TypeValidator<T>
): T | null => {
  const validation = validateJsonType(jsonString, validator);
  if (validation.isValid) {
    return JSON.parse(jsonString!) as T;
  }
  return null;
};
