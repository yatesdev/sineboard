export abstract class IRenderer {
  name: string;
  options?: object;

  abstract render(canvas: import('../types/canvas').Canvas, data: any): void;
}

export interface IRendererDefinition {
  name: string;
  options?: object;
}
