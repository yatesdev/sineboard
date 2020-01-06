import { Canvas, createCanvas, createImageData } from 'canvas';
import fs from 'fs';
import path from 'path';

import { SineboardClientBase } from '@yatesdev/sineboard-client-base';
import { IDisplayTemplate } from '@yatesdev/sineboard-core';

export class SineboardDebugClient extends SineboardClientBase {
  private readonly canvas: Canvas;
  private readonly context: CanvasRenderingContext2D;

  constructor() {
    super();
    this.canvas = createCanvas(this.displayWidth, this.displayHeight);
    this.context = this.canvas.getContext('2d');
  }

  onDisplay(template: IDisplayTemplate, buffer: Buffer): void {
    const imageData = createImageData(new Uint8ClampedArray(buffer), template.template.width, template.template.height);

    this.context.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.context.putImageData(imageData, 0, 0);

    this.outputToFile();
  }

  onEmptyDisplay(): void {
    this.context.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.context.fillStyle = 'rgb(200,200,200)';
    this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);

    this.outputToFile();
  }

  private outputToFile() {
    const exportStream = this.canvas.createPNGStream();
    const debugPath = path.resolve(process.cwd(), './debug', 'output.png');
    const fileStream = fs.createWriteStream(debugPath);
    exportStream.pipe(fileStream);
  }
}
