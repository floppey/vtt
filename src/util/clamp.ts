type ClampBaseOptions = {
  /**
   * The minimum value of the range
   */
  min: number;
  /**
   * The maximum value of the range
   */
  max: number;
  /**
   * If loop is true, the value will wrap around to the other side of the range
   */
  loop?: boolean;
};
type ClampWithDefault = ClampBaseOptions & {
  /**
   * The value to clamp
   */
  value: number | null | undefined;
  /**
   * The default value to use if the value is null or undefined
   */
  defaultValue: number;
};

type ClampWithoutDefault = ClampBaseOptions & {
  /**
   * The value to clamp
   */
  value: number;
};
type ClampOptions = ClampWithDefault | ClampWithoutDefault;

const isClampWithDefault = (
  options: ClampOptions
): options is ClampWithDefault => {
  return (
    typeof options.value !== "number" &&
    typeof (options as ClampWithDefault).defaultValue === "number"
  );
};

export const clamp = (options: ClampOptions): number => {
  const { min, max } = options;
  let value: number = 0;
  if (isClampWithDefault(options)) {
    value = options.defaultValue;
  } else {
    value = options.value;
  }

  if (options.loop) {
    const range = max - min + 1;
    return min + ((((value - min) % range) + range) % range);
    // return ((((value - min) % range) + range) % range) + min;
  }
  // Ensure the validValue is within the specified range
  return Math.min(Math.max(value, min), max);
};
