import React, { useRef } from 'react';
import { Resizable } from 're-resizable';
import { DynamicResizerProps } from './types/interface';
import './styles.scss';
import useDrag from './hooks/useDrag';

const DynamicResizer: React.FC<DynamicResizerProps> = ({
  direction = 'vertical',
  children,
  defaultWidth,
  defaultHeight,
  minTopHeight,
  minBottomHeight,
  minLeftWidth,
  minRightWidth,
  localKey,
  enableEdges = ['right', 'bottom'],
  onResizeStart,
  onResize,
  onResizeStop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dynamicResizerProps = useDrag({
    direction,
    containerRef,
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
  });

  return (
    <div className={`dynamic-resizer-content ${direction}`} ref={containerRef}>
      <Resizable {...dynamicResizerProps}>
        <div className='resizable-child'>{children[0]}</div>
      </Resizable>

      <div className='resizable-child-two'>{children[1]}</div>
    </div>
  );
};

export default DynamicResizer;
