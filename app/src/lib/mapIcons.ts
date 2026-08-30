// Canvas-drawn SDF icons for MapLibre symbol layers — flat geometric marks,
// no external image requests, tintable per-feature via icon-color.
function canvasImageData(size: number, draw: (ctx: CanvasRenderingContext2D) => void): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  draw(ctx);
  return ctx.getImageData(0, 0, size, size);
}

export function vesselArrowIcon(size = 24): ImageData {
  return canvasImageData(size, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(size / 2, 1);
    ctx.lineTo(size - 3, size - 3);
    ctx.lineTo(size / 2, size * 0.68);
    ctx.lineTo(3, size - 3);
    ctx.closePath();
    ctx.fill();
  });
}

export function detectionDiamondIcon(size = 22): ImageData {
  return canvasImageData(size, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(size / 2, 1);
    ctx.lineTo(size - 1, size / 2);
    ctx.lineTo(size / 2, size - 1);
    ctx.lineTo(1, size / 2);
    ctx.closePath();
    ctx.fill();
  });
}

export function ringIcon(size = 22): ImageData {
  return canvasImageData(size, (ctx) => {
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  });
}
