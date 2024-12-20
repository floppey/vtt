import { RGB } from "@/vtt/types/types";

export const rgbToHex = (rgb: RGB): string => {
  const { r, g, b, a } = rgb;
  return (
    "#" +
    [r, g, b]
      .map((value) => {
        const hex = value.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("") +
    (a ? Math.round(a * 255).toString(16) : "")
  );
};
