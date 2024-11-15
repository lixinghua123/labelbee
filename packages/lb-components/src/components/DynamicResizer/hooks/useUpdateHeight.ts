import { useEffect, useState, useCallback } from 'react';
import { useLocalStorageState } from 'ahooks';
import { DragProps } from '../types/interface';
import { calcMaxSize, calcMinSize, adjustDefaultSize } from '../utils';

const useUpdateHeight = ({
  containerRef,
  direction,
  defaultHeight = 10,
  defaultWidth = 10,
  minTopHeight = 10,
  minBottomHeight = 10,
  minLeftWidth = 10,
  minRightWidth = 10,
  localKey = 'dynamicResizerLocalKey',
}: DragProps) => {
  const [width, setWidth] = useState<number | string>(0);
  const [height, setHeight] = useState<number | string>(0);
  const [minWidth, setMinWidth] = useState<number | string | undefined>(undefined);
  const [minHeight, setMinHeight] = useState<number | string | undefined>(undefined);
  const [maxWidth, setMaxWidth] = useState<number | string | undefined>(undefined);
  const [maxHeight, setMaxHeight] = useState<number | string | undefined>(undefined);
  // Cache width
  const [localWidth, setLocalWidth] = useLocalStorageState<number | string | undefined>(
    localKey + 'width',
  );
  // Cache height
  const [localHeight, setLocalHeight] = useLocalStorageState<number | string | undefined>(
    localKey + 'height',
  );
  // Mark the first rendering
  const [isInitialSetupDone, setIsInitialSetupDone] = useState<boolean>(false);

  useEffect(() => {
    setIsInitialSetupDone(true);

    return () => {
      setIsInitialSetupDone(false);
    };
  }, []);

  // init
  useEffect(() => {
    if (isInitialSetupDone) {
      initSize();
    }
  }, [isInitialSetupDone]);

  // When the total height of the outer box changes, update the maximum and minimum heights
  useEffect(() => {
    if (isInitialSetupDone && direction === 'vertical') {
      updateMaxAndMinHeight();
    }
  }, [isInitialSetupDone, containerRef.current?.offsetHeight, minTopHeight, minBottomHeight]);

  // When the total width of the outer box changes, update the maximum and minimum widths
  useEffect(() => {
    if (isInitialSetupDone && direction === 'horizontal') {
      updateMaxAndMinWidth();
    }
  }, [isInitialSetupDone, containerRef.current?.offsetWidth, minLeftWidth, minRightWidth]);

  /* -----------------------Events-------------------------- */
  // Initialize the height passed in from the outside and set the maximum limit. If it exceeds half of the container, take half to set
  const initSize = () => {
    if (containerRef?.current) {
      const containerWidth = containerRef?.current.offsetWidth;
      const containerHeight = containerRef?.current.offsetHeight;

      // Calculate initialization width and height
      let calcWidth = containerWidth;
      let calcHeight = containerHeight;

      if (direction === 'vertical') {
        // Vertical layout needs to pay attention to the initialization height, and the width should be fully filled by default
        calcHeight = adjustDefaultSize(
          localHeight,
          minTopHeight,
          minBottomHeight,
          containerHeight,
          defaultHeight,
        );
      } else if (direction === 'horizontal') {
        // Horizontal layout needs to pay attention to initializing the width, and the height should be fully supported by default
        calcWidth = adjustDefaultSize(
          localWidth,
          minLeftWidth,
          minRightWidth,
          containerWidth,
          defaultWidth,
        );
      }

      /* -----------------------Set the default width, height, and cache values for the current drag and drop settings-------------------------- */
      updateWidth(calcWidth);
      updateHeight(calcHeight);
    }
  };

  const updateMaxAndMinWidth = useCallback(() => {
    if (containerRef?.current) {
      const containerWidth = containerRef?.current.offsetWidth;
      // Initialize maximum and minimum width
      let minWidth = containerWidth;
      let maxWidth = containerWidth;

      minWidth = calcMinSize(minLeftWidth, containerWidth);
      maxWidth = calcMaxSize(minRightWidth, containerWidth);

      /* -----------------------Set default configuration parameters-------------------------- */
      setMinWidth(minWidth);
      setMaxWidth(maxWidth);
    }
  }, [containerRef, minLeftWidth, minRightWidth]);

  const updateMaxAndMinHeight = useCallback(() => {
    if (containerRef?.current) {
      const containerHeight = containerRef?.current.offsetHeight;
      // Initialize maximum and minimum heights
      let minHeight = containerHeight;
      let maxHeight = containerHeight;

      minHeight = calcMinSize(minTopHeight, containerHeight);
      maxHeight = calcMaxSize(minBottomHeight, containerHeight);

      /* -----------------------Set default configuration parameters-------------------------- */
      setMinHeight(minHeight);
      setMaxHeight(maxHeight);
    }
  }, [containerRef, minTopHeight, minBottomHeight]);

  const updateWidth = useCallback(
    // When dragging vertically, the height changes while the width remains at 100%
    (width: number) => {
      const calcWidth = direction === 'horizontal' ? width : '100%';
      setWidth(calcWidth);
      setLocalWidth(calcWidth);
    },
    [direction, width],
  );

  const updateHeight = useCallback(
    // When dragging horizontally, the width changes and the height remains at 100%
    (height: number) => {
      const calcHeight = direction === 'vertical' ? height : '100%';
      setHeight(calcHeight);
      setLocalHeight(calcHeight);
    },
    [direction, height],
  );

  return {
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    updateWidth,
    updateHeight,
  };
};

export default useUpdateHeight;
