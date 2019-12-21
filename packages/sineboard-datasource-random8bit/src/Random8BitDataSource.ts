import { IDataSource } from '@yatesdev/sineboard-core';

export default class Random8BitDataSource implements IDataSource {
  name = 'Random8BitDataSource';
  data: any;
  updateFrequency = '*/1 * * * * *';
  options?: object;

  constructor(overrides?: IRandom8BitDataSourceOptions) {
    if (overrides && overrides.options) {
      Object.assign(this.options, overrides.options);
    }
    if (overrides && overrides.updateFrequency) {
      this.updateFrequency = overrides.updateFrequency;
    }
  }

  fetch() {
    this.data = Math.floor(Math.random() * 255);
  }
}

interface IRandom8BitDataSourceOptions {
  options?: object;
  updateFrequency?: string;
}
