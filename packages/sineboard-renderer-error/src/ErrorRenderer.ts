import { IRenderer } from '@yatesdev/sineboard-core';
import { Canvas } from '@yatesdev/sineboard-core/types/canvas';

export class ErrorRenderer implements IRenderer {
  name = 'ErrorRenderer';

  constructor() { }

  render(canvas: Canvas) {
    const context = canvas.getContext('2d');
    context.lineWidth = 1;
    context.fillStyle = 'rgb(255, 0, 0)';
    context.strokeStyle = context.fillStyle;
    context.strokeRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(canvas.width, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, canvas.height);
    context.lineTo(canvas.width, 0);
    context.stroke();
  }

}
