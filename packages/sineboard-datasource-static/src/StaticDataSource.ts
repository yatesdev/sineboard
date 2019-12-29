import { IDataSource } from '@yatesdev/sineboard-core';

export default class StaticDataSource implements IDataSource {
  name = 'StaticDataSource';
  data: any;
  updateFrequency: string = null;

  constructor(overrides?: Partial<IDataSourceOverrides>) {
    if (!overrides) { return; }
    this.updateFrequency = overrides.updateFrequency ?? this.updateFrequency;
    this.data = overrides.data ?? this.data;
  }

  fetch() { }
}

interface IDataSourceOverrides {
  updateFrequency: string;
  data: number | string;
}
