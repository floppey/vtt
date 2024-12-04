type ClampBaseOptions = {
  min: number;
  max: number;
  loop?: boolean;
};
type ClampWithDefault = ClampBaseOptions & {
  value: number | null | undefined;
  defaultValue: number;
};

type ClampWithoutDefault = ClampBaseOptions & {
  value: number;
};
type ClampOptions = ClampWithDefault | ClampWithoutDefault;

const isClampWithDefault = (
  options: ClampOptions
): options is ClampWithDefault => {
  return typeof options.value !== "number";
};

export const clamp = (options: ClampOptions): number => {
  const { min, max } = options;
  let value: number = 0;
  if (isClampWithDefault(options)) {
    value = options.defaultValue ?? min;
  } else {
    value = options.value;
  }

  if (options.loop) {
    if (value < min) {
      return max;
    }
    if (value > max) {
      return min;
    }
    return value;
  }
  // Ensure the validValue is within the specified range
  return Math.min(Math.max(value, min), max);
};
