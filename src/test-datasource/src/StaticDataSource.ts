import { IDataSource } from '@yatesdev/sineboard-core';

export default class StaticDataSource implements IDataSource {
  name = 'StaticDatasource';
  data: any;
  updateFrequency: number;
  options = {};

  constructor(overrides?: IStaticDataSourceOptions) {
    if (overrides && overrides.options) {
      Object.assign(this.options, overrides.options);
    }
    if (overrides && overrides.updateFrequency) {
      this.updateFrequency = overrides.updateFrequency;
    }
  }

  fetch() {
    this.data = Math.floor(Math.random() * 100);
  }
}

interface IStaticDataSourceOptions {
  options?: object;
  updateFrequency?: number;
}
