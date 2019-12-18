export abstract class IRenderer {
  name: string;
  render(canvas: import('../types/canvas').Canvas, data: any) {}
}

export interface IRendererDefinition {
  name: string;
  options?: object;
}
