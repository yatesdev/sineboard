import { Events, IDataSource, ITemplate, IPageDisplay } from '@yatesdev/sineboard-core';
import { ConnectionManager } from '../connection';
import { flatten, moduleLoader } from '../util';

import { Canvas } from 'canvas';
import { DataSourceManager } from 'datasource';

export class TemplateInitializer {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly dataSourceManager: DataSourceManager,
  ) {}

  async start() {
    this.connectionManager.subscribeToChannel(Events.ConfigurationLoaded);
    this.connectionManager.channels.get(Events.ConfigurationLoaded).on('message', (channel, configurationKey) => {
      this.loadClientConfiguration(configurationKey);
    });

    // handle api reboot and pull existing
    const clientList = await this.connectionManager.redis.smembers('clients');
    clientList.forEach((clientKey) => this.loadClientConfiguration(`template:${clientKey}`));

    const canvas = new Canvas(720, 720);
    const context = canvas.getContext('2d');
    context.fillRect(0, 0, 50, 50);
    context.fillRect(100, 100, 150, 150);
    const exportBuffer = canvas.toBuffer();

    this.connectionManager.redis.pipeline()
      .setBuffer('exportTest', exportBuffer)
      .publish(Events.TemplateRendered, 'exportTest')
      .exec();
  }

  private async loadClientConfiguration(redisKey: string) {
    const configuration = JSON.parse(await this.connectionManager.redis.get(redisKey)) as IPageDisplay;
    // grab datasources
    console.log(configuration);
    const dataSources = flatten(configuration.template).map((x) => x.dataSource);
    const modules = moduleLoader(dataSources.map((x) => x.name)).map( (x) => new x.default());
    console.log(modules);
    modules.forEach((x: IDataSource) => {
      // x.fetch();
      // console.log(x.data);
      this.dataSourceManager.add(x,
        configuration.schedule.startDate,
        configuration.schedule.endDate,
        x.updateFrequency);
    });
  }
}
