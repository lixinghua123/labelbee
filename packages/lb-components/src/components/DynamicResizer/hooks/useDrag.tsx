import { useEffect, useState } from 'react';
import { DragProps } from '../types/interface';
import useUpdateHeight from './useUpdateHeight';
import useDraggingAllowed from './useDraggingAllowed';

const useDrag = ({
  containerRef,
  direction,
  defaultHeight,
  defaultWidth,
  minTopHeight,
  minBottomHeight,
  minLeftWidth,
  minRightWidth,
  localKey,
  enableEdges,
  onResizeStart,
  onResize,
  onResizeStop,
}: DragProps) => {
  const { width, height, minWidth, minHeight, maxWidth, maxHeight, updateHeight, updateWidth } =
    useUpdateHeight({
      direction,
      containerRef,
      minTopHeight,
      minBottomHeight,
      defaultHeight,
      minLeftWidth,
      minRightWidth,
      defaultWidth,
      localKey,
    });

  const enable = useDraggingAllowed(direction, enableEdges);

  // Hide scrollbar at the beginning of drag and drop
  const [isDragging, setIsDragging] = useState(false);

  const handleResizeStart = () => {
    setIsDragging(true);
    if (onResizeStart) {
      onResizeStart();
    }
  };

  const handleResize = () => {
    if (onResize) {
      onResize();
    }
  };

  const handleResizeStop = (e: any, direction: any, ref: HTMLElement) => {
    setIsDragging(false);
    updateWidth(ref.offsetWidth);
    updateHeight(ref.offsetHeight);

    if (onResizeStop) {
      onResizeStop();
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      if (isDragging) {
        containerRef.current.classList.add('hide-scrollbar');
      } else {
        containerRef.current.classList.remove('hide-scrollbar');
      }
    }
  }, [isDragging, containerRef.current]);

  const dynamicResizerProps = {
    size: {
      width,
      height,
    },
    onResizeStart: handleResizeStart,
    onResize: handleResize,
    onResizeStop: handleResizeStop,
    enable: enable,
    handleClasses: {
      right: 'dynamic-right-handle', // Customize the class on the right edge
      bottom: 'dynamic-bottom-handle', // Custom bottom edge class
    },
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
  };

  return dynamicResizerProps;
};

export default useDrag;
