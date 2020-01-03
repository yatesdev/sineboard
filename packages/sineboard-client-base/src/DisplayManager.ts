import { IPageDisplay } from '@yatesdev/sineboard-core';

export class DisplayManager {
  private readonly _display: Generator<{ page: IPageDisplay; buffer: Buffer; }, never, never>;
  private readonly _store: Map<IPageDisplay, Buffer>;
  private readonly _nameIndex: Map<string, IPageDisplay>;

  constructor() {
    this._store = new Map();
    this._nameIndex = new Map();
    this._display = this.displayGenerator();
  }

  next() {
    return this._display.next();
  }

  any(): boolean {
    return this._store.size > 0;
  }

  set(screen: IPageDisplay, buffer: Buffer = null) {
    this._store.set(screen, buffer);
    this._nameIndex.set(screen.name, screen);
  }

  getByTemplateName(name: string) {
    if (!this._nameIndex.has(name)) { return null; }

    const key = this._nameIndex.get(name);
    return {
      template: key,
      buffer: this._store.get(key),
    };
  }

  /**
   * Infinitely loops over rendered display screens
   */
  private *displayGenerator(): Generator<{ page: IPageDisplay; buffer: Buffer; }, never, never> {
    let screens = this._store.entries();
    while (true) {
      const nextScreen = screens.next();
      if (nextScreen.done) {
        if (this._store.size > 0) {
          screens = this._store.entries(); // reset to beginning
          continue;
        }
      }
      yield { page: nextScreen.value[0], buffer: nextScreen.value[1] };
    }
  }
}
