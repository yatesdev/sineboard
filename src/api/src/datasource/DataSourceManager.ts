import { Events, IDataSource } from '@yatesdev/sineboard-core';
import Schedule from 'node-schedule'; // Need to figure out how to make this typeable or instanceable
import hash from 'object-hash';
import { ConnectionManager } from '../connection';

export class DataSourceManager {
  jobs: Map<string, Schedule.Job>;
  dataSources: IDataSource[];
  scheduler: any; // technically the Schedule type

  constructor(
    private readonly connectionManager: ConnectionManager,
  ) {
    this.jobs = new Map();
    this.dataSources = [];
    this.scheduler = Schedule;
  }

  start() {
    // this.connectionManager.channels.get(Events.ConfigurationLoaded).on('message', async (channel, key) => {
    //   await this.connectionManager.redis.get(key);
    // });
  }

  add(dataSource: IDataSource, startDate: string, endDate: string, updateFrequency: string | number, onFetch: () => void) {
    const hashId = hash(dataSource.name, {
      excludeKeys: (key: string) => key !== 'name' && key !== 'options' && key !== 'updateFrequency' },
    );
    const job = this.scheduler.scheduleJob(
      hashId,
      {
        start: startDate,
        end: endDate,
        rule: updateFrequency,
      }, async () => {
        await dataSource.fetch();
        onFetch();
      });
    this.jobs.set(hashId, job);
  }
}
