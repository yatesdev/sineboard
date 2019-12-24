import { IRenderer } from '@yatesdev/sineboard-core';
import { Canvas } from '@yatesdev/sineboard-core/types/canvas';
import { Logger } from '@yatesdev/sineboard-log';

export default class BlockRenderer implements IRenderer {
  name = 'BlockRenderer';
  options: IBlockRendererOptions = {
    color: 'rgb(0,0,0)',
  };

  constructor(overrides?: Partial<IBlockRendererOptions>) {
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
    Logger.info(`Execution time (render): ${renderEnd[0]}s ${renderEnd[1] / 1000000}ms`);
  }

}

interface IBlockRendererOptions {
  color: string;
}
