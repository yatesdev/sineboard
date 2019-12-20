import { IRenderer } from '@yatesdev/sineboard-core';
import { Canvas } from '@yatesdev/sineboard-core/types/canvas';

export default class BlockRenderer implements IRenderer {
  name = 'BlockRenderer';
  options: IBlockRendererOptions = {
    color: 'rgb(0,0,0)',
  };

  constructor(overrides?: IBlockRendererOptions) {
    if (overrides) {
      Object.assign(this.options, overrides);
    }
  }
  render(canvas: Canvas, data: any): void {
    const renderStart = process.hrtime();
    const context = canvas.getContext('2d');

    context.fillStyle = this.options.color;
    if (data) {
      context.fillStyle = `rgb(0,${data},0)`;
    }
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderEnd = process.hrtime(renderStart);
    console.log('Execution time (render): %ds %dms', renderEnd[0], renderEnd[1] / 1000000);
  }

}

interface IBlockRendererOptions {
  color: string;
}
