/**
 * @file Measurer
 * @author lixinghua <lixinghua_vendor@sensetime.com>
 * @date 2024.01.16
 */

import { MeasureOperation, EventBus } from '@labelbee/lb-annotation';
import { ICoordinate } from '@labelbee/lb-utils';
import React, { useEffect, useRef } from 'react';

interface IProps {
  size?: {
    width?: number;
    height?: number;
  };
  imgNode?: HTMLImageElement;
  zoom?: number;
  currentPos: ICoordinate;
}

const MeasureCanvas: React.FC<IProps> = (props) => {
  const { size, imgNode, zoom, currentPos } = props;
  const canvasRef = useRef(null);
  const measureOperation = useRef<any>(null);

  useEffect(() => {
    if (canvasRef.current && size?.width && size?.height && imgNode && zoom) {
      const toolInstance = new MeasureOperation({
        container: canvasRef.current,
        size,
        imgNode,
      });
      toolInstance.init();
      measureOperation.current = toolInstance;

      // 将当前的位置信息传递至给测量器内
      toolInstance.updatePosition({ zoom, currentPos });
    }

    return () => {
      if (measureOperation.current) {
        const toolInstance = measureOperation.current;
        toolInstance?.destroy();
        EventBus.emit('updatePosition', {
          currentPos: toolInstance.currentPos,
          zoom: toolInstance.zoom,
        });
      }
    };
  }, [canvasRef]);

  // 该部分由于外层会实时更改，故先暂时去除 TODO
  /** 窗口大小监听 */
  useEffect(() => {
    if (measureOperation.current && size?.width && size?.height) {
      measureOperation.current?.setSize(size);
    }
  }, [size?.width, size?.height]);

  /** 设置当前图片节点 */
  useEffect(() => {
    if (measureOperation.current && imgNode && zoom && currentPos) {
      const toolInstance = measureOperation.current;
      toolInstance?.setImgNode(imgNode);
      toolInstance.updatePosition({ zoom, currentPos });
      toolInstance.setResult([]);
    }
  }, [imgNode]);

  return <div style={{ position: 'relative', ...size }} id='measureOperation' ref={canvasRef} />;
};

export default MeasureCanvas;
