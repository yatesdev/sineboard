import { Events, IDataSource, ITemplate } from '@yatesdev/sineboard-core';
import { ConnectionManager } from 'connection';
import { flatten, moduleLoader } from '../util';

import { Canvas } from 'canvas';

export class TemplateInitializer {
  constructor(
    private readonly connectionManager: ConnectionManager,
  ) {}

  start() {
    this.connectionManager.subscribeToChannel(Events.ConfigurationLoaded);
    this.connectionManager.channels.get(Events.ConfigurationLoaded).on('message', (channel, configurationKey) => {
      this.loadClientConfiguration(configurationKey);
    });

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
    const configuration = JSON.parse(await this.connectionManager.redis.get(redisKey)) as ITemplate;
    // grab datasources
    const dataSources = flatten(configuration).map((x) => x.dataSource);
    const modules = moduleLoader(dataSources.map((x) => x.name)).map( (x) => new x.default());
    console.log(modules);
    modules.forEach((x: IDataSource) => {
      x.fetch();
      console.log(x.data);
    });
  }
}
