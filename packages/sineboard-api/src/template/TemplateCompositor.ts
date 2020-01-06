import { ITemplate } from '@yatesdev/sineboard-core';
import { Canvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

export const TemplateCompositor = (t: ITemplate): Canvas => {
  if (Array.isArray(t.children)) {
    const context = t.canvas.getContext('2d');

    t.children.forEach((child) => {
      TemplateCompositor(child);

      context.drawImage(child.canvas, child.posX, child.posY);
    });
  }
  // // DEBUG ONLY
  // const exportStream = t.canvas.createPNGStream();
  // const debugPath = path.resolve(process.cwd(), './debug', `${t.name}.png`);
  // const fileStream = fs.createWriteStream(debugPath);
  // exportStream.pipe(fileStream);
  return t.canvas;
};
