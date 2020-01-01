import { IDataSource, ISchedule } from '@yatesdev/sineboard-core';
import { CronJob } from 'cron';
import hash from 'object-hash';
import { ConnectionManager } from '../connection';

export class DataSourceManager {
  dataSourceJobs: Map<string, CronJob[]>;
  scheduleJobs: Map<string, CronJob[]>;

  constructor(
    private readonly connectionManager: ConnectionManager,
  ) {
    this.dataSourceJobs = new Map();
    this.scheduleJobs = new Map();
  }

  add(dataSource: IDataSource, schedule: ISchedule, templateName: string, onFetch: () => void) {
    const scheduleKey = templateName + hash(schedule + templateName);

    if (!this.scheduleJobs.has(scheduleKey)) {
      const scheduleJobStart = new CronJob({
        cronTime: schedule.start,
        start: true,
        onTick: () => {
          const dataSourceJobs = this.dataSourceJobs.get(scheduleKey);
          if (Array.isArray(dataSourceJobs)) {
            dataSourceJobs.forEach((job) => {
              if (!job.running) {
                job.start();
                job.fireOnTick();
              }
            });
          }
        },
      });

      const scheduleJobEnd = new CronJob({
        cronTime: schedule.end,
        start: true,
        onTick: () => {
          const dataSourceJobs = this.dataSourceJobs.get(scheduleKey);
          if (Array.isArray(dataSourceJobs)) {
            dataSourceJobs.forEach((job) => {
              if (job.running) {
                job.stop();
              }
            });
          }
        },
      });
      this.scheduleJobs.set(scheduleKey, [scheduleJobStart, scheduleJobEnd]);
    }

    if (!this.dataSourceJobs.has(scheduleKey)) {
      this.dataSourceJobs.set(scheduleKey, []);
    }

    const dataSourceJob = new CronJob({
      cronTime: dataSource.updateFrequency,
      onTick: async () => {
        await dataSource.fetch();
        onFetch();
      },
    });

    const scheduledDataSourceJobs = this.dataSourceJobs.get(scheduleKey);
    scheduledDataSourceJobs.push(dataSourceJob);
  }
}
