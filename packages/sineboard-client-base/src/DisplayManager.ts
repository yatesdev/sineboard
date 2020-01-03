import { IPageDisplay } from '@yatesdev/sineboard-core';

export class DisplayManager {
  private readonly _display: Generator;
  private readonly _store: Map<IPageDisplay, Buffer>;

  constructor() {
    this._store = new Map();
    this._display = this.displayGenerator();
  }

  next() {
    return this._display.next();
  }

  any(): boolean {
    return this._store.size > 0;
  }

  /**
   * Infinitely loops over rendered display screens
   */
  private *displayGenerator(): Generator {
    let screens = this._store.entries();
    while (true) {
      const nextScreen = screens.next();
      if (nextScreen.done) {
        if (this._store.size > 0) {
          screens = this._store.entries(); // reset to beginning
          continue;
        }
      }
      yield nextScreen.value;
    }
  }
}
