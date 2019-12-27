import { IRenderer, IRendererDefinition } from '@yatesdev/sineboard-core';
import { moduleLoader } from '../util';

export const RendererFactory = (renderer: IRendererDefinition | string): IRenderer => {
  if (typeof renderer === 'string') {
    const rendererModule = moduleLoader([renderer])[0].default;
    renderer = new rendererModule();
  } else {
    const { name, ...options } = renderer;
    const rendererModule = moduleLoader([name])[0].default;
    renderer = new rendererModule(options);
  }
  return renderer as IRenderer;
};
