import { useMemo } from 'react';
import { EdgeDirection, ResizableDirection } from '../types/interface';

const useDraggingAllowed = (
  direction: ResizableDirection = 'vertical',
  enableEdges?: EdgeDirection[],
) => {
  // Determine whether the current direction allows dragging
  const isDraggingAllowed = (layout: ResizableDirection, edge: EdgeDirection) => {
    return direction === layout && enableEdges?.includes(edge);
  };

  // Return enable object based on direction and enableEdges
  const enable = useMemo(() => {
    const top = isDraggingAllowed('vertical', 'top');
    const bottom = isDraggingAllowed('vertical', 'bottom');
    const left = isDraggingAllowed('horizontal', 'left');
    const right = isDraggingAllowed('horizontal', 'right');

    return {
      top,
      bottom,
      left,
      right,
      topLeft: false,
      ropRight: false,
      bottomLeft: false,
      bottomRight: false,
    };
  }, [direction, enableEdges]);

  return enable;
};

export default useDraggingAllowed;
