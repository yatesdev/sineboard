import { Events, IDataSource } from '@yatesdev/sineboard-core';
import Schedule from 'node-schedule'; // Need to figure out how to make this typeable or instanceable
import { ConnectionManager } from '../connection';

export class DataSourceManager {
  dataSources: IDataSource[];
  scheduler: any; // technically the Schedule type

  constructor(
    private readonly connectionManager: ConnectionManager,
  ) {
    this.dataSources = [];
    this.scheduler = Schedule;
  }

  start() {
    // this.connectionManager.channels.get(Events.ConfigurationLoaded).on('message', async (channel, key) => {
    //   await this.connectionManager.redis.get(key);
    // });
  }

  add(dataSource: IDataSource, startDate: string, endDate: string, updateFrequency: string | number) {
    const job = this.scheduler.scheduleJob({
      start: startDate,
      end: endDate,
      rule: updateFrequency,
    }, dataSource.fetch);
    console.log(job);
  }
}
