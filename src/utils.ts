/**
 * Listening for element size changes.
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
  }

  function addListen(callback) {
    handle = requestAnimationFrame(() => listen(callback));
  }

  function removeListen() {
    cancelAnimationFrame(handle);
  }

  return { addListen, removeListen };
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
  };

  calcSize = (texts: string[], isColumn: boolean, axisItemWidth: number) => {
    const { canvas, ctx } = this;
    const containerWidth = canvas.width;
    const containerHeight = canvas.height;
    const totalSize = isColumn ? containerHeight : containerWidth;
    // Bars read width directly, no need to compare, 'perSize' is only used if rotation is required.
    let perSize = isColumn ? axisItemWidth : totalSize / texts.length - 16;
    // 12 is the font size, indicating that the smallest character needs to be accommodated.
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
    // Get interval
    const interval = Math.round(texts.length * MIN_CHAR_SIZE / totalSize);
    return {
      rotate: maxWidth ? -45 : 0,
      maxWidth,
      perSize: maxWidth ? axisItemWidth : perSize, // If you need to rotate, take the set width directly.
      interval
    };
  };
}

export const canvasUtilsIns = new CanvasUtils();

export const safeParseNumberOrText = (num : number | string | undefined, precision: number) => {
  if(!num) {
    return '';
  }

  const a = Number(num);
  if(isNaN(a)) {
    return '';
  }
  return a.toFixed(precision);
};


export const safeParseNumberOrTextWithSeparator = (num : number | string | undefined, precision: number) => {
  if(!num) {
    return '';
  }

  const a = Number(num);
  if(isNaN(a)) {
    return '';
  }
  
  // Format with thousand separator and fixed precision
  return a.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
};
