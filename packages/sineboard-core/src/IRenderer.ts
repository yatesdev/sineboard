import { Canvas } from '../types/canvas';

export abstract class IRenderer {
  name: string;
  options?: object;

  abstract render(canvas: Canvas, data: any): void;
}

export interface IRendererDefinition {
  name: string;
  options?: object;
}
