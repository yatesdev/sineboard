import { Canvas, createCanvas, createImageData } from 'canvas';
import fs from 'fs';
import path from 'path';

import { SineboardClientBase } from '@yatesdev/sineboard-client-base';

export class SineboardDebugClient extends SineboardClientBase {
  private readonly canvas: Canvas;
  private readonly context: CanvasRenderingContext2D;

  constructor() {
    super();
    this.canvas = createCanvas(100, 100);
    this.context = this.canvas.getContext('2d');
  }

  onDisplay(display: Buffer): void {
    const imageData = createImageData(new Uint8ClampedArray(display), this.displayWidth, this.displayHeight);

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.putImageData(imageData, 0, 0);

    this.outputToFile();
  }

  onEmptyDisplay(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = 'rgb(200,200,200)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.outputToFile();
  }

  private outputToFile() {
    const exportStream = this.canvas.createPNGStream();
    const debugPath = path.resolve(process.cwd(), './debug', 'foo.png');
    const fileStream = fs.createWriteStream(debugPath);
    exportStream.pipe(fileStream);
  }
}
