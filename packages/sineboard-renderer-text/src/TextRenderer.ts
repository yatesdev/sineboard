import { IRenderer } from '@yatesdev/sineboard-core';
import { Canvas } from '@yatesdev/sineboard-core/types/canvas';
import { Logger } from '@yatesdev/sineboard-log';

export default class TextRenderer implements IRenderer {
  name = 'TextRenderer';
  options: ITextRendererOptions = {
    color: 'rgb(255,255,255)',
    font: 'mono',
    fontSize: 5,
  };

  constructor(overrides?: Partial<ITextRendererOptions>) {
    Object.assign(this.options, overrides);
  }

  render(canvas: Canvas, data: any): void {
    const renderStart = process.hrtime();
    const context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle =  this.options.color;
    context.font = `${this.options.fontSize}px ${this.options.font}`;
    context.antialias = 'none';
    context.textBaseline = 'top';

    context.fillText(data, 0, 0);

    const renderEnd = process.hrtime(renderStart);
    Logger.info(`Execution time (render): ${renderEnd[0]}s ${renderEnd[1] / 1000000}ms`);
  }

}

interface ITextRendererOptions {
  color: string;
  font: string;
  fontSize: number;
}
