import { Events, IDisplayTemplate, ITemplate } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';

import * as fs from 'fs';
import * as path from 'path';

import { ConnectionManager } from '../connection';
import { DataSourceManager } from '../datasource';
import { flatten } from '../util';

import { TemplateCompositor } from './TemplateCompositor';
import { TemplateFactory } from './TemplateFactory';

export class TemplateInitializer {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly dataSourceManager: DataSourceManager,
  ) {}

  async start() {
    this.connectionManager.subscribeToChannel(Events.ConfigurationLoaded);
    this.connectionManager.channels.get(Events.ConfigurationLoaded).on('message', (_, key) => this.loadClientConfiguration(key));

    // handle api reboot and pull existing client configuration
    const clientList = await this.connectionManager.redis.smembers('clients');
    clientList.forEach((clientKey) => this.loadClientConfiguration(`template:${clientKey}`));
  }

  private async loadClientConfiguration(redisKey: string) {
    let configuration: IDisplayTemplate | IDisplayTemplate[] = JSON.parse(await this.connectionManager.redis.get(redisKey));

    if (!Array.isArray(configuration)) {
      configuration = [configuration];
    }

    configuration.forEach((page) => {
      const temp = TemplateFactory(page.template);

      flatten(temp).map((template) => {
        // Immediately trigger render for static datasources
        if (!template.dataSource.updateFrequency) {
          this.dataSourceUpdated(template, page)();
          return;
        }

        this.dataSourceManager.add(
          template.dataSource,
          page.schedule,
          template.name,
          this.dataSourceUpdated(template, page));
      });
    });
  }

  private dataSourceUpdated(template: ITemplate, page: IDisplayTemplate) {
    return async () => {
      // console.log(template.name, template.dataSource.data);
      if (template.children) {
        template.children.forEach((child) => {
          this.dataSourceUpdated(child, page);
        });
      }
      if (template.renderer) {
        template.renderer.render(template.canvas, template.dataSource.data);
      }

      // find rootNode to send to compositor
      let rootNode = template;
      while (rootNode.parent) {
        rootNode = rootNode.parent;
      }

      const compositeStart = process.hrtime();
      const output = TemplateCompositor(rootNode);
      const compositeEnd = process.hrtime(compositeStart);
      Logger.info(`Execution time (composition): ${compositeEnd[0]}s ${compositeEnd[1] / 1000000}ms`);

      const exportBuffer = Buffer.from(output.getContext('2d').getImageData(0, 0, output.width, output.height).data);

      // // strip the A from RGBA[] and convert Uint8ClampedArray to Uint8Array
      // // TODO: Migrate this to client side, as that would allow RGB matrix and canvas clients
      // const rgbExportBuffer = Buffer.from(new Uint8Array(exportBuffer.filter((_: any, index: number) => (index + 1) % 4)));
      const exportKey = `rendered:${page.name}`;
      await this.connectionManager.redis.pipeline()
        .setBuffer(exportKey, exportBuffer)
        .publish(Events.TemplateRendered, exportKey)
        .exec();

      // DEBUG ONLY
      const exportStream = output.createPNGStream();
      const debugPath = path.resolve(process.cwd(), './debug', 'foo.png');
      const fileStream = fs.createWriteStream(debugPath);
      exportStream.pipe(fileStream);
    };
  }
}
