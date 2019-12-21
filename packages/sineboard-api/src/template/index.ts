import { Events, IPageDisplay, ITemplate } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';
import { Canvas } from 'canvas';
// import * as fs from 'fs';
import { ConnectionManager } from '../connection';
import { DataSourceManager } from '../datasource';
import { flatten } from '../util';

import { TemplateFactory } from './TemplateFactory';

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
    const temp = TemplateFactory(configuration.template);

    const dataSourceUpdated = (template: ITemplate) => {
      const templateCompositor = (t: ITemplate): Canvas => {
        if (Array.isArray(t.children)) {
          const context = t.canvas.getContext('2d');

          t.children.forEach((child) => {
            templateCompositor(child);

            context.drawImage(child.canvas, child.posX, child.posY);
          });
        }
        return t.canvas;
      };

      return async () => {
        // console.log(template.name, template.dataSource.data);
        if (template.children) {
          template.children.forEach((child) => {
            dataSourceUpdated(child);
          });
        }
        if (template.renderer) {
          template.renderer.render(template.canvas, template.dataSource.data);
        }

        // find rootNode to send to compositor
        let rootNode = template;
        do {
          if (rootNode.parent) {
            rootNode = rootNode.parent;
          }
        } while (rootNode.parent);

        const compositeStart = process.hrtime();
        const output = templateCompositor(rootNode);
        const compositeEnd = process.hrtime(compositeStart);
        Logger.info(`Execution time (composition): ${compositeEnd[0]}s ${compositeEnd[1] / 1000000}ms`);

        const exportBuffer = output.getContext('2d').getImageData(0, 0, output.width, output.height).data; // output.toBuffer('raw');
        // strip the A from RGBA[]
        const rgbExportBuffer = Buffer.from(new Uint8Array(exportBuffer.filter((_: any, index: number) => (index + 1) % 4)));

        await this.connectionManager.redis.pipeline()
          .setBuffer('exportTest', rgbExportBuffer)
          .publish(Events.TemplateRendered, 'exportTest')
          .exec();

        // DEBUG ONLY
        // const exportStream = output.createPNGStream();
        // const fileStream = fs.createWriteStream('./foo.png');
        // exportStream.pipe(fileStream);
      };
    };

    flatten(temp).map((template) => {
      this.dataSourceManager.add(
        template.dataSource,
        configuration.schedule.startDate,
        configuration.schedule.endDate,
        template.dataSource.updateFrequency,
        dataSourceUpdated(template));
    });
  }
}
