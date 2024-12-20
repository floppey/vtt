import { StringValidator } from "@/validation/Validator";
import { RGB } from "@/vtt/types/types";

export const hexToRgb = (hex: string): RGB => {
  const validator = new StringValidator({
    errorMessage: `"${hex}" is not a valid hex color`,
  }).isHexColor();
  if (!validator.validate(hex)) {
    console.error(validator.errorMessage);
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  const hexValue = hex.replace(/^#/, "");
  const hexValueLength = hexValue.length;

  // Check if the hex code is short (3 or 4 characters) or long (6 or 8 characters)
  const isShortHex = hexValueLength === 3 || hexValueLength === 4;

  // Determine how many characters to slice for each color component
  let hexValueArray = hexValue.split("");

  // Double each character if it's a short hex code
  if (isShortHex) {
    hexValueArray = hexValueArray
      .map((char) => char.repeat(2))
      .join("")
      .split("");
  }

  // Extract RGB values from the hex code
  const r = parseInt(hexValueArray.splice(0, 2).join(""), 16);
  const g = parseInt(hexValueArray.splice(0, 2).join(""), 16);
  const b = parseInt(hexValueArray.splice(0, 2).join(""), 16);

  let a = 1; // Default alpha (opacity) to 1 (fully opaque)

  if (hexValueArray.length === 2) {
    const alphaHex = hexValueArray.splice(0, 2).join(""); // Extract last 2 characters for alpha
    a = parseInt(alphaHex, 16) / 255; // Convert to a range between 0 and 1
  }

  return { r, g, b, a };
};
