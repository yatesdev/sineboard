import { Canvas, CanvasRenderingContext2D } from '../types';

/**
 * This is a reexport of the Canvas types for use in modules that reference sineboard-core (specifically renderers and templates)
 * This type definition is a copy of node-canvas built in definitions as of 2.6.1
 * https://github.com/Automattic/node-canvas/blob/master/types/index.d.ts
 *
 * This was done to allow typescript typings for external plugins for sineboard.
 * Node-canvas is a separate installer and is not useful for the base class/interface as the only useful thing is the typing at this level.
 * This would be easier if node-canvas had a @types/canvas package however since it is internal to the module, I don't want to add it as a 
 * dependency of the base functionality of Sineboard.
 */
export { Canvas, CanvasRenderingContext2D } from '../types';

export class CanvasWrapper {
  canvas: Canvas;
  context: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.canvas = new Canvas(width, height);
    this.context = this.canvas.getContext('2d');
  }
}
