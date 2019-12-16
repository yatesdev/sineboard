import { Events, IDataSource, IPageDisplay, ITemplate, ITemplateDefinition, IDataSourceDefinition } from '@yatesdev/sineboard-core';
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

    // initialize template instances
    const temp = this.initTemplate(configuration.template);

    flatten(temp).map((template) => {
      console.log(template.dataSource);
      this.dataSourceManager.add(
        template.dataSource,
        configuration.schedule.startDate,
        configuration.schedule.endDate,
        template.dataSource.updateFrequency,
        () => {
          console.log(template.name, template.dataSource.data);
        });
    });
  }

  private initTemplate(root: ITemplateDefinition | string): ITemplate {
    if (typeof root === 'string') {
      const templateModule = moduleLoader([root])[0].default;
      root = new templateModule();
      return this.initTemplate(root);
    }
    if (Array.isArray(root.children)) {
      root.children.map((child) => {
        const initializedChild = this.initTemplate(child);
        initializedChild.parent = root as ITemplate;
      });
    }

    root.dataSource = this.initDataSource(root.dataSource);

    return root as ITemplate;
  }

  private initDataSource(dataSource: IDataSourceDefinition | string): IDataSource {
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
  }
}
