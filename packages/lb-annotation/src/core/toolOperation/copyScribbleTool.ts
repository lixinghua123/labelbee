import { ImgConversionUtils, ToolStyleUtils } from '@labelbee/lb-utils';
// import FormatPixelEdge from 'web-worker:./formatPixelEdge.js';
import AxisUtils from '@/utils/tool/AxisUtils';
import DrawUtils from '@/utils/tool/DrawUtils';
import { EScribblePattern, EToolName } from '@/constant/tool';
import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import AttributeUtils from '@/utils/tool/AttributeUtils';
import EKeyCode from '@/constant/keyCode';
import { BasicToolOperation, IBasicToolOperationProps } from './basicToolOperation';

interface IProps extends IBasicToolOperationProps {}

const DEFAULT_PEN_SIZE = 20;
const DEFAULT_COLOR = 'white';

class ScribbleTool extends BasicToolOperation {
  public toolName = EToolName.ScribbleTool;

  public defaultAttributeInfo?: IInputList;

  public config!: IScribbleConfig;

  public isHidden: boolean;

  private action = EScribblePattern.Scribble;

  private cacheCanvas?: HTMLCanvasElement;

  private cacheContext?: CanvasRenderingContext2D;

  private renderCacheCanvas?: HTMLCanvasElement; // view

  private renderCacheContext?: CanvasRenderingContext2D; // view

  private preCacheCanvas?: HTMLCanvasElement; // view

  private preCacheContext?: CanvasRenderingContext2D; // view

  private penSize;

  private startPoint?: ICoordinate; // Origin Coordinate

  private prePoint?: ICoordinate; // preview Coordinate

  private pointList: ICoordinate[]; // line Coordinate

  private curIndexOnLine: number; // Location for connection state undo and redo record pointList

  private lineActive?: boolean; // line active

  private active?: boolean; //  active

  constructor(props: IProps) {
    super(props);

    this.penSize = DEFAULT_PEN_SIZE;

    this.isHidden = false;
    this.pointList = [];
    this.curIndexOnLine = 0;

    // Init defaultAttributeInfo
    if (this.config.attributeList?.length > 0) {
      const firstAttributeInfo = this.config.attributeList[0];
      this.setDefaultAttribute(firstAttributeInfo.value);
    }
  }

  public get cursorErase() {
    const svgIcon = `<?xml version="1.0" encoding="UTF-8"?><svg width="24" heighst="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#icon-65e7e1747c11bad3)"><path d="M44.7818 24.1702L31.918 7.09935L14.1348 20.5L27.5 37L30.8556 34.6643L44.7818 24.1702Z" fill="#141414" stroke="#000000" stroke-width="4" stroke-linejoin="miter"/><path d="M27.4998 37L23.6613 40.0748L13.0978 40.074L10.4973 36.6231L4.06543 28.0876L14.4998 20.2248" stroke="#000000" stroke-width="4" stroke-linejoin="miter"/><path d="M13.2056 40.072L44.5653 40.072" stroke="#000000" stroke-width="4" stroke-linecap="round"/></g><defs><clipPath id="icon-65e7e1747c11bad3"><rect width="48" height="48" fill="#df4c4c"/></clipPath></defs></svg>`;
    const iconUrl = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgIcon)))}`;
    return `url(${iconUrl}) 0 0, auto`;
  }

  public get defaultCursor() {
    if (this.action === EScribblePattern.Erase) {
      return this.cursorErase;
    }

    return this.isShowDefaultCursor ? 'default' : 'none';
  }

  public get color() {
    return this?.defaultAttributeInfo?.color ?? DEFAULT_COLOR;
  }

  public get penSizeWithZoom() {
    return this.penSize / this.zoom;
  }

  public get cacheCanvasToDataUrl() {
    return this.cacheCanvas?.toDataURL('image/png', 0);
  }

  public getOriginCoordinate = (e: MouseEvent) => {
    return AxisUtils.changePointByZoom(this.getCoordinateUnderZoomByRotate(e), 1 / this.zoom);
  };

  public setPenSize(size: number) {
    this.penSize = size;
    this.render();
  }

  public initCacheCanvas(imgNode?: HTMLImageElement) {
    if (this.cacheCanvas || !imgNode) {
      return;
    }

    const { canvas, ctx } = ImgConversionUtils.createCanvas(imgNode);
    this.cacheCanvas = canvas;
    this.cacheContext = ctx;

    const { canvas: renderCanvas, ctx: renderCtx } = ImgConversionUtils.createCanvas(imgNode);
    this.renderCacheCanvas = renderCanvas;
    this.renderCacheContext = renderCtx;

    const { canvas: preCanvas, ctx: preCtx } = ImgConversionUtils.createCanvas(imgNode);
    this.preCacheCanvas = preCanvas;
    this.preCacheContext = preCtx;
  }

  public updateCacheCanvasSize(imgNode: HTMLImageElement) {
    if (this.cacheCanvas) {
      this.cacheCanvas.width = imgNode.width;
      this.cacheCanvas.height = imgNode.height;
    }
  }

  public updateUrl2CacheContext(url: string) {
    ImgConversionUtils.createImgDom(url).then((img) => {
      if (!this.cacheContext) {
        this.initCacheCanvas(img);
      }
      if (this.cacheContext) {
        this.cacheContext.save();
        this.clearCacheCanvas();
        this.cacheContext.drawImage(img, 0, 0, img.width, img.height);
        this.cacheContext.restore();

        if (this.preCacheContext) {
          const data = this.cacheContext.getImageData(
            0,
            0,
            this.cacheContext.canvas.width,
            this.cacheContext.canvas.height,
          );
          this.preCacheContext.putImageData(data, 0, 0);
        }
      }
      // if (this.attributeLockList.length > 0 && this.renderCacheContext) {
      //   this.renderCacheContext.save();
      //   this.clearCacheCanvas();
      //   this.renderCacheContext.drawImage(img, 0, 0, img.width, img.height);
      //   this.renderCacheContext.restore();
      // }

      this.render();
    });
  }

  public setImgNode(imgNode: HTMLImageElement, basicImgInfo?: Partial<{ valid: boolean; rotate: number }>): void {
    super.setImgNode(imgNode, basicImgInfo);
    if (this.cacheCanvas) {
      this.updateCacheCanvasSize(imgNode);
    } else {
      this.initCacheCanvas(imgNode);
    }
  }

  public setResult(data: IScribbleData[]) {
    // Only has one layer
    let { url } = data?.[0] ?? {};

    this.clearCacheCanvas();

    // Create an Empty Page when the result is empty.
    if (!url) {
      url = this.cacheCanvasToDataUrl ?? '';
    }

    this.history.initRecord([url], true);
    if (!url) {
      this.render();
      return;
    }
    this.updateUrl2CacheContext(url);
  }

  public onKeyDown(e: KeyboardEvent): boolean | void {
    if (!CommonToolUtils.hotkeyFilter(e)) {
      // If it is an input box, filter it
      return;
    }

    const { keyCode } = e;
    const keyCode2Attribute = AttributeUtils.getAttributeByKeycode(keyCode, this.config.attributeList);

    if (keyCode2Attribute !== undefined) {
      this.setDefaultAttribute(keyCode2Attribute);
    }

    if (keyCode === EKeyCode.Z && !e.ctrlKey) {
      this.toggleIsHide();
    }

    if (e.ctrlKey) {
      if (this.action === EScribblePattern.Scribble) {
        this.lineActive = true;
      }
      if (keyCode === EKeyCode.Z) {
        this.lineActive = false;
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      }
      this.render();
    }
  }

  public onKeyUp(e: KeyboardEvent) {
    super.onKeyUp(e);

    if (e.keyCode === EKeyCode.Ctrl) {
      this.lineActive = false;
      this.pointList = [];
      this.curIndexOnLine = 0;
      this.render();
    }
  }

  public toggleIsHide() {
    this.setIsHidden(!this.isHidden);
    this.render();
  }

  public eventBinding() {
    super.eventBinding();
  }

  public onMouseDown = (e: MouseEvent) => {
    if (super.onMouseDown(e) || this.forbidMouseOperation || !this.imgInfo) {
      return undefined;
    }

    // Init Image
    this.initCacheCanvas(this.imgNode);
    this.mouseEvents('onMouseDown').call(this, e);
  };

  public onMouseMove = (e: MouseEvent) => {
    if (super.onMouseMove(e) || this.forbidMouseOperation || !this.imgInfo) {
      return undefined;
    }
    this.mouseEvents('onMouseMove').call(this, e);
  };

  public onMouseUp = (e: MouseEvent) => {
    if (super.onMouseUp(e) || this.forbidMouseOperation || !this.imgInfo) {
      return undefined;
    }

    this.mouseEvents('onMouseUp').call(this, e);
  };

  public mouseEvents = (eventType: 'onMouseMove' | 'onMouseUp' | 'onMouseDown') => {
    const events = {
      [EScribblePattern.Scribble]: {
        onMouseMove: this.onScribbleMove,
        onMouseUp: this.onScribbleEnd,
        onMouseDown: this.onScribbleStart,
      },
      [EScribblePattern.Erase]: {
        onMouseMove: this.onEraseMove,
        onMouseUp: this.onEraseEnd,
        onMouseDown: this.onEraseStart,
      },
    };

    return events[this.action][eventType];
  };

  public setPattern = (pattern: EScribblePattern) => {
    this.action = pattern;

    switch (pattern) {
      case EScribblePattern.Erase: {
        this.setCustomCursor(this.cursorErase);
        break;
      }

      default: {
        this.setCustomCursor('none');
        break;
      }
    }
  };

  public setDefaultAttribute(attributeValue: string) {
    const attributeInfo = this.config.attributeList.find((v) => v.value === attributeValue);
    if (!this.attributeLockList.includes(this.defaultAttributeInfo?.value || '')) {
      this.copyCacheContext(attributeInfo);
    }
    if (attributeInfo) {
      this.defaultAttribute = attributeInfo.value;
      this.defaultAttributeInfo = attributeInfo;
      //  触发侧边栏同步
      this.emit('changeAttributeSidebar');
      this.render();
    }
  }

  public clearStatusAfterLeave() {
    this.onScribbleEnd();
    this.startPoint = undefined;
  }

  public onMouseLeave(): void {
    super.onMouseLeave();
    this.clearStatusAfterLeave();
  }

  public onScribbleStart(e: MouseEvent) {
    if (!this.cacheContext) {
      return;
    }

    this.cacheContext.save();
    this.cacheContext.beginPath();
    this.cacheContext.strokeStyle = this.color;
    this.cacheContext.lineWidth = this.penSizeWithZoom;
    this.cacheContext.lineCap = 'round';
    this.cacheContext.lineJoin = 'round';
    const originCoordinate = this.getOriginCoordinate(e);
    this.cacheContext.moveTo(originCoordinate.x, originCoordinate.y);
    this.startPoint = originCoordinate;

    const copyOriginCoordinate = this.getOriginCoordinate(e);

    if (!this.preCacheContext || !this.renderCacheContext) {
      return;
    }
    this.active = true;
    this.preCacheContext.save();
    this.preCacheContext.beginPath();
    this.preCacheContext.strokeStyle = this.color;
    this.preCacheContext.lineWidth = this.penSizeWithZoom;
    this.preCacheContext.lineCap = 'round';
    this.preCacheContext.lineJoin = 'round';
    this.preCacheContext.moveTo(copyOriginCoordinate.x, copyOriginCoordinate.y);
    this.startPoint = copyOriginCoordinate;
    if (!this.attributeLockList.includes(this.defaultAttributeInfo?.value || '')) {
      const data = this.renderCacheContext.getImageData(
        0,
        0,
        this.renderCacheContext.canvas.width,
        this.renderCacheContext.canvas.height,
      );
      this.preCacheContext.putImageData(data, 0, 0);
    }
  }

  // Draw lines on the image
  public scribbleOnImgByLine(endPoint: ICoordinate) {
    const ctx = this.cacheContext;
    const renderCtx = this.preCacheContext;

    if (!ctx || !renderCtx) {
      return;
    }
    this.pointList = this.pointList.slice(0, this.curIndexOnLine + 1);
    this.pointList.push(endPoint);

    if (this.pointList.length > 1) {
      this.curIndexOnLine = this.pointList.length - 1;
      this.pointList.forEach((point, index) => {
        ctx.beginPath();
        if (index > 0) {
          const prePoint = this.pointList[index - 1];
          ctx.save();
          ctx.moveTo(prePoint.x, prePoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.restore();
        }
        renderCtx.beginPath();
        if (index > 0) {
          const prePoint = this.pointList[index - 1];
          renderCtx.save();
          renderCtx.moveTo(prePoint.x, prePoint.y);
          renderCtx.lineTo(point.x, point.y);
          renderCtx.stroke();
          renderCtx.restore();
        }
      });
    }
  }

  public onScribbleMove(e: MouseEvent) {
    const originCoordinate = this.getOriginCoordinate(e);
    if (this.lineActive) {
      this.prePoint = originCoordinate;
      return;
    }

    if (e.buttons === 1 && this.cacheContext && this.startPoint) {
      // this.cacheContext.lineTo(e.offsetX, e.offsetY);
      this.cacheContext.lineTo(originCoordinate.x, originCoordinate.y);
      this.cacheContext.stroke();
      if (this.preCacheContext) {
        this.preCacheContext.lineTo(originCoordinate.x, originCoordinate.y);
        this.preCacheContext.stroke();
      }
      // this.prevAxis = { x: e.offsetX, y: e.offsetY };
    }
  }

  public onScribbleEnd(e?: MouseEvent) {
    if (!e || e?.button === 2) {
      return;
    }
    const originCoordinate = this.getOriginCoordinate(e);
    if (this.lineActive) {
      this.scribbleOnImgByLine(originCoordinate);
    } else if (this.cacheContext) {
      this.cacheContext.lineTo(originCoordinate.x, originCoordinate.y);
      this.cacheContext.stroke();
    }
    if (this.preCacheContext && !this.attributeLockList.includes(this.defaultAttributeInfo?.value || '')) {
      this.active = false;
      // this.preCacheContext.clearRect(0, 0, this.preCacheContext.canvas.width, this.preCacheContext.canvas.height);
    }
    this.saveUrlIntoHistory();
  }

  // Save the url of the canvas image into History
  public saveUrlIntoHistory() {
    this.cacheContext?.closePath();
    this.cacheContext?.restore();
    this.startPoint = undefined;
    this.history.pushHistory(this.cacheCanvasToDataUrl);
    // this.copyCacheContext();
  }

  public copyCacheContext(attributeInfo?: IInputList) {
    if (this.attributeLockList?.length > 0) {
      const imgData = this.cacheContext?.getImageData(
        0,
        0,
        this.cacheContext.canvas.width,
        this.cacheContext.canvas.height,
      );

      const attribute = this.config.attributeList.filter((t) => this.attributeLockList.includes(t.value));
      if (attributeInfo) {
        attribute.push(attributeInfo);
      }
      const attributes = attribute.map((t) => ToolStyleUtils.toRGBAArr(t?.color || '') || []);
      console.log('1111', imgData);
      console.time('xxx');
      if (imgData && this.renderCacheContext) {
        // const formatPixelEdge = new FormatPixelEdge();
        // formatPixelEdge.current = formatPixelEdge;
        // formatPixelEdge.postMessage({ imgData, attributes });
        // formatPixelEdge.onmessage = (e: any) => {
        //   this.renderCacheContext?.putImageData(e.data.imgData, 0, 0);
        //   formatPixelEdge.terminate();
        //   formatPixelEdge.current = undefined;
        // };
        const canvas = document.createElement('canvas');
        canvas.width = this.renderCacheContext.canvas.width;
        canvas.height = this.renderCacheContext.canvas.height;
        const ctx = canvas.getContext('2d')!;
        const imgData1 = ctx?.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < imgData.data.length / 4; i++) {
          const index = i * 4;
          const r = imgData.data[index];
          const g = imgData.data[index + 1];
          const b = imgData.data[index + 2];
          // imgData.data[index] = 0;
          // imgData.data[index + 1] = 0;
          // imgData.data[index + 2] = 0;
          // imgData.data[index + 3] = 0;
          // If it is originBackgroundRGBA. It needs to update to backgroundRGBA
          for (let j = 0; j < attributes.length; j++) {
            const scope = 2;
            const colorArr = attributes[j] || [];
            if (
              r >= ~~colorArr[0] - scope &&
              r <= ~~colorArr[0] + scope &&
              g >= ~~colorArr[1] - scope &&
              g <= ~~colorArr[1] + scope &&
              b >= ~~colorArr[2] - scope &&
              b <= ~~colorArr[2] + scope
            ) {
              imgData1.data[index] = ~~colorArr[0];
              imgData1.data[index + 1] = ~~colorArr[1];
              imgData1.data[index + 2] = ~~colorArr[2];
              imgData1.data[index + 3] = 255;
            }
          }
        }
        console.timeEnd('xxx');
        this.preCacheContext?.putImageData(imgData1, 0, 0);
        if (!attributeInfo) {
          this.renderCacheContext?.putImageData(imgData1, 0, 0);
        }
      }
    }
  }

  public eraseArc(e: MouseEvent) {
    if (this.cacheContext) {
      const originCoordinate = this.getOriginCoordinate(e);
      this.cacheContext.save();
      this.cacheContext.beginPath();
      this.cacheContext.arc(originCoordinate.x, originCoordinate.y, this.penSizeWithZoom / 2, 0, Math.PI * 2, false);
      this.cacheContext.clip();
      this.cacheContext.clearRect(0, 0, this.cacheContext.canvas.width, this.cacheContext.canvas.height);
      this.cacheContext?.restore();
    }
    if (this.preCacheContext) {
      const originCoordinate = this.getOriginCoordinate(e);
      this.preCacheContext.save();
      this.preCacheContext.beginPath();
      this.preCacheContext.arc(originCoordinate.x, originCoordinate.y, this.penSizeWithZoom / 2, 0, Math.PI * 2, false);
      this.preCacheContext.clip();
      this.preCacheContext.clearRect(0, 0, this.preCacheContext.canvas.width, this.preCacheContext.canvas.height);
      this.preCacheContext?.restore();
    }
  }

  public onEraseStart(e: MouseEvent) {
    if (!this.cacheContext || e.buttons !== 1 || this.isHidden) {
      return;
    }
    this.eraseArc(e);
  }

  public onEraseMove(e: MouseEvent) {
    if (!this.cacheContext || e.buttons !== 1 || this.isHidden) {
      return;
    }

    this.eraseArc(e);
  }

  public onEraseEnd() {}

  public exportData() {
    const imgBase64 = this.cacheCanvasToDataUrl;

    return [[], this.basicImgInfo, { imgBase64 }];
  }

  public clearCacheCanvas() {
    this.cacheContext?.clearRect(0, 0, this.cacheContext.canvas.width, this.cacheContext.canvas.height);
    this.preCacheContext?.clearRect(0, 0, this.preCacheContext.canvas.width, this.preCacheContext.canvas.height);
    this.renderCacheContext?.clearRect(
      0,
      0,
      this.renderCacheContext.canvas.width,
      this.renderCacheContext.canvas.height,
    );
    this.render();
  }

  public clearResult() {
    this.curIndexOnLine = 0;
    this.pointList = [];
    this.clearCacheCanvas();

    // Need to add a record.
    this.history.pushHistory(this.cacheCanvasToDataUrl);
  }

  public renderPoint(radius: number) {
    DrawUtils.drawCircleWithFill(this.canvas, this.coord, radius, { color: this.color });
  }

  public renderBorderPoint(radius: number) {
    DrawUtils.drawCircle(this.canvas, this.coord, radius, { color: 'black' });
  }

  // Draw line before scribbling on the image
  public drawLineSegment() {
    if (this.prePoint && this.pointList.length > 0) {
      const endPoint = this.pointList[this.curIndexOnLine];
      const points = [endPoint].concat(this.prePoint);
      const drawPoints = points.map((p: ICoordinate) => this.getCoordinateUnderZoomByRotateFromImgPoint(p));
      this.drawStraightLine(drawPoints, {
        color: this.color,
        lineWidth: this.penSize,
        globalAlpha: 0.5,
      });
    }
  }

  public render() {
    super.render();
    if (!this.ctx || !this.cacheCanvas) {
      return;
    }
    if (this.lineActive) {
      this.renderCursorLine(this.color);
      this.drawLineSegment();
    }
    const radius = this.penSize / 2;
    // Hide the drawn track
    if (this.isHidden) {
      // When in scribble mode, points need to be displayed
      if (this.action === EScribblePattern.Scribble) {
        this.renderPoint(radius);
      }
      return;
    }
    this.ctx.save();
    this.ctx.globalAlpha = 0.5;
    let viewNode = this.cacheCanvas;
    if (this.attributeLockList?.length > 0) {
      if (this.renderCacheCanvas) {
        viewNode = this.renderCacheCanvas;
      }
      if (this.active && this.preCacheCanvas) {
        viewNode = this.preCacheCanvas;
      }
    }
    DrawUtils.drawImg(this.canvas, viewNode, {
      zoom: this.zoom,
      currentPos: this.currentPos,
      rotate: this.rotate,
      attributeList: this.config.attributeList,
      attributeLockList: this.attributeLockList,
    });
    this.ctx.restore();
    // Forbid Status stop render Point.

    if (this.forbidOperation || this.forbidCursorLine) {
      return;
    }

    if (this.action === EScribblePattern.Erase) {
      this.renderBorderPoint(radius);
    } else {
      this.renderPoint(radius);
    }
  }

  /** 撤销 */
  public undo() {
    if (this.lineActive && (this.curIndexOnLine < 1 || this.pointList?.length < 1)) {
      return;
    }

    if (this.curIndexOnLine > 0 && this.pointList?.length > 0) {
      this.curIndexOnLine -= 1;
    }
    const url = this.history.undo();
    if (url && this.cacheCanvas) {
      this.updateUrl2CacheContext(url);
    }
  }

  public redo() {
    if (this.curIndexOnLine < this.pointList?.length - 1 && this.pointList?.length > 0) {
      this.curIndexOnLine += 1;
    }
    const url = this.history.redo();

    if (url && this.cacheCanvas) {
      this.updateUrl2CacheContext(url);
    }
  }
}

export default ScribbleTool;
