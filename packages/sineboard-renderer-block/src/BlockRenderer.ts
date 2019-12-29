import { IRenderer } from '@yatesdev/sineboard-core';
import { Canvas } from '@yatesdev/sineboard-core/types/canvas';
import { Logger } from '@yatesdev/sineboard-log';

export default class BlockRenderer implements IRenderer {
  name = 'BlockRenderer';
  options: IBlockRendererOptions = {
    color: 'rgb(0,0,0)',
    borderSize: 0,
    borderColor: 'rgb(255, 255, 255)',
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
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (this.options.borderSize) {
      context.strokeStyle = this.options.borderColor;
      context.lineWidth = this.options.borderSize;
      context.strokeRect(0, 0, canvas.width, canvas.height);
    }

    const renderEnd = process.hrtime(renderStart);
    Logger.info(`Execution time (render): ${renderEnd[0]}s ${renderEnd[1] / 1000000}ms`);
  }

}

interface IBlockRendererOptions {
  color: string;
  borderSize: number;
  borderColor: string;
}
