import { Canvas, createCanvas, createImageData } from 'canvas';
import fs from 'fs';

import { SineboardClientBase } from '@yatesdev/sineboard-client-base';
import { IDisplayTemplate } from '@yatesdev/sineboard-core';

export class SineboardFrameBufferClient extends SineboardClientBase {
  private frameBuffer: number;
  private canvas: Canvas;
  private context: CanvasRenderingContext2D;

  constructor() {
    super();
    this.canvas = createCanvas(this.displayWidth, this.displayHeight);
    this.context = this.canvas.getContext('2d');
    this.frameBuffer = fs.openSync('/dev/fb0', 'w');
  }

  onDisplay(template: IDisplayTemplate, buffer: Buffer) {
    const imageData = createImageData(new Uint8ClampedArray(buffer), template.template.width, template.template.height);
    this.context.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.context.putImageData(imageData, 0, 0);

    this.outputToFrameBuffer();
  }

  onEmptyDisplay(): void {
    this.context.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.context.fillStyle = 'rgb(255,0,0)';
    this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);

    this.outputToFrameBuffer();
  }

  private outputToFrameBuffer() {
    const output = this.canvas.toBuffer('raw');
    fs.writeSync(this.frameBuffer, output, 0, output.byteLength, 0);
  }
}
