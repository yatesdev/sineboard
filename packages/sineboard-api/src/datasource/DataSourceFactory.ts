import { IDataSource, IDataSourceDefinition } from '@yatesdev/sineboard-core';
import { moduleLoader } from '../util';

export const DataSourceFactory = (dataSource: IDataSourceDefinition | string): IDataSource  => {
  // datasource: '@foo/bar'
  if (typeof dataSource === 'string') {
    const dataSourceModule = moduleLoader([dataSource])[0].default;
    dataSource = new dataSourceModule();
  } else { // datasource: { name: '@foo/bar', updateFrequency: '*/5 * * * * *' }
    const { name, ...options } = dataSource;
    const dataSourceModule = moduleLoader([name])[0].default;
    dataSource = new dataSourceModule(options);
  }
  return dataSource as IDataSource;
};
