import { CanvasWrapper, IRenderer } from '@yatesdev/sineboard-core';

export class BlockRenderer implements IRenderer {
  name = 'BlockRenderer';

  render(canvas: CanvasWrapper, data: any): void {
    canvas.context.fillRect(0, 0, canvas.canvas.width, canvas.canvas.height);
  }

}
