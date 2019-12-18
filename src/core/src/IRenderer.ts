import { CanvasWrapper } from './Canvas';

export abstract class IRenderer {
  name: string;
  render(canvas: CanvasWrapper, data: any) {}
}

export interface IRendererDefinition {
  name: string;
  options?: object;
}
