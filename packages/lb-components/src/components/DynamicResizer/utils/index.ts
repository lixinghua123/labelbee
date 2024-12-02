// Determine whether it is a percentage string
const isPercentage = (value: string | number): boolean => {
  return typeof value === 'string' && value.endsWith('%') && !isNaN(parseFloat(value));
};

// Convert the percentage string to a specific numerical value
const calculatePercentage = (value: string, totalSize: number): number => {
  const percentage = parseFloat(value);
  if (isNaN(percentage)) {
    return 0;
  }
  return (percentage / 100) * totalSize;
};

// Check if the incoming value is a valid number or percentage
export const isValidSize = (value: any): boolean => {
  return (typeof value === 'number' && value > 0) || isPercentage(value);
};

// Processing maximum value - supported percentage
export const calcMaxSize = (curSize: number | string, limitSize: number) => {
  if (!isValidSize(curSize)) {
    return limitSize;
  }

  // If it is a percentage, convert it to a numerical value
  if (typeof curSize === 'string' && isPercentage(curSize)) {
    return calculatePercentage(curSize, limitSize);
  }

  return limitSize - Number(curSize);
};

// Initial minimum value - supported percentage
export const calcMinSize = (curSize: number | string, totalSize: number) => {
  if (!isValidSize(curSize)) {
    return 0;
  }

  // If it is a percentage, convert it to a numerical value
  if (typeof curSize === 'string' && isPercentage(curSize)) {
    return calculatePercentage(curSize, totalSize);
  }

  return Number(curSize);
};

// Calculate default size, compatible with initialization, drag and drop scenarios, etc
export const adjustDefaultSize = (
  curSize: number | string | undefined,
  minPrimarySize: number | string, // Default minimum main size
  minSecondarySize: number | string, // Default minimum size
  containerSize = 0, // The total width or height of the container
  defaultSize: number,
): number => {
  // If defaultSize is set, use defaultSize as the main parameter
  if (!isValidSize(curSize)) {
    if (defaultSize < containerSize) {
      return defaultSize;
    }
    return Math.min(containerSize, calcMinSize(minPrimarySize, containerSize)); // 默认情况下使用 minPrimarySize 和containerSize中的最小值
  }

  // If minPrimarySize+minSecondarySize exceeds containerSize, return 50% of the container
  if (
    calcMinSize(minPrimarySize, containerSize) + calcMinSize(minSecondarySize, containerSize) >
    containerSize
  ) {
    // Exceeding the container size, return 50% of the container
    return containerSize * 0.5;
  }

  // Ensure that curSize is between minPrimarySize and containerSize minSecondarySize
  const minValidSize = calcMinSize(minPrimarySize, containerSize); // Calculate the minimum main size
  const maxValidSize = containerSize - calcMinSize(minSecondarySize, containerSize); // Calculate the maximum main size

  // Update the logic here to return the valid range value of curSize
  const currentSize =
    typeof curSize === 'string' && isPercentage(curSize)
      ? calculatePercentage(curSize, containerSize)
      : Number(curSize) || 0;

  return Math.min(Math.max(currentSize, minValidSize), maxValidSize); // Return the size within the legal range
};
