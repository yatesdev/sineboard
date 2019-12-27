import { IDataSource } from '@yatesdev/sineboard-core';

export default class StaticDataSource implements IDataSource {
  name = 'StaticDataSource';
  data: any;
  updateFrequency = '0 */1 * * * *';

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
