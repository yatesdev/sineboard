import { ITemplate } from '@yatesdev/sineboard-core';
import { Canvas } from 'canvas';

export const TemplateCompositor = (t: ITemplate): Canvas => {
  if (Array.isArray(t.children)) {
    const context = t.canvas.getContext('2d');

    t.children.forEach((child) => {
      TemplateCompositor(child);

      context.drawImage(child.canvas, child.posX, child.posY);
    });
  }
  return t.canvas;
};
