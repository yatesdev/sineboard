import { IRenderer } from '@yatesdev/sineboard-core';
import { Canvas } from '@yatesdev/sineboard-core/types/canvas';
import * as fs from 'fs';

export default class BlockRenderer implements IRenderer {
  name = 'BlockRenderer';
  options?: IBlockRendererOptions;

  constructor(overrides?: IBlockRendererOptions) {
    if (overrides) {
      this.options = overrides;
    }
  }
  render(canvas: Canvas, data: any): void {
    const renderStart = process.hrtime();
    // console.log(this.options, data);
    const context = canvas.getContext('2d');

    context.fillStyle = this.options.color;
    if (data) {
      context.fillStyle = `rgb(0,${data},0)`;
    }
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderEnd = process.hrtime(renderStart);
    console.log('Execution time (render): %ds %dms', renderEnd[0], renderEnd[1] / 1000000);

    const exportStream = canvas.createPNGStream();
    const fileStream = fs.createWriteStream('./foo.png');
    exportStream.pipe(fileStream);
    fileStream.on('close', () => console.log('done'));
  }

}

interface IBlockRendererOptions {
  color: string;
}
