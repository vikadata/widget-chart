/**
 * 监听元素尺寸变化
 */
export function listenDOMSize(dom: React.RefObject<HTMLElement>) {
  let size = { x: -1, y: -1, width: -1, height: -1 };

  let handle: number;

  function listen(callback) {
    if (dom.current) {
      const { x, y, width, height } = dom.current.getBoundingClientRect();
      if (width !== size.width || height !== size.height) {
        const result = { x, y, width, height };
        size = result;
        callback(result);
      }
    }
    handle = requestAnimationFrame(() => listen(callback));
  };
  
  function addListen(callback) {
    handle = requestAnimationFrame(() => listen(callback));
  }

  function removeListen() {
    cancelAnimationFrame(handle);
  }

  return { addListen, removeListen }
}

const MIN_CHAR_SIZE = 12;

class CanvasUtils {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private font: string;

  constructor() {
    const canvas = document.createElement('canvas');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.font = '12px sans-serif';
  }

  setCanvasSize = (width, height) => {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  calcSize = (texts: string[], isColumn: boolean, axisItemWidth: number) => {
    const { canvas, ctx } = this;
    const containerWidth = canvas.width;
    const containerHeight = canvas.height;
    const totalSize = isColumn ? containerHeight : containerWidth;
    // 条形图直接读取宽度，不需要比较，perSize 仅用于是否需要旋转
    let perSize = isColumn ? axisItemWidth : totalSize / texts.length - 16;
    // 12 为字体大小，表示最小也需要容纳一个字符
    if (perSize < MIN_CHAR_SIZE) {
      perSize = MIN_CHAR_SIZE;
    }
    ctx.font = this.font;
    let maxWidth = 0;
    for (let i = 0; i < texts.length; i++) {
      const itemWidth = ctx.measureText(texts[i]).width;
      if (itemWidth > perSize) {
        maxWidth = Math.max(maxWidth, itemWidth);
      }
    }
    // 获取间隔
    const interval = Math.round(texts.length * MIN_CHAR_SIZE / totalSize);
    return {
      rotate: maxWidth ? -45 : 0,
      maxWidth,
      perSize: maxWidth ? axisItemWidth : perSize, // 需要旋转的话直接取设置的宽度
      interval
    };
  }
}

export const canvasUtilsIns = new CanvasUtils();