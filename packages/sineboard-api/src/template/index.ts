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
    clientList.forEach((clientId) => this.loadClientConfiguration(`client:${clientId}`));
  }

  private async loadClientConfiguration(clientHashKey: string) {
    const metadata: any = JSON.parse(await this.connectionManager.redis.hget(clientHashKey, 'metadata'));
    const configuration: IDisplayTemplate[] = JSON.parse(await this.connectionManager.redis.hget(clientHashKey, 'template'));

    configuration.forEach((page) => {
      const temp = TemplateFactory(page.template);

      flatten(temp).map((template) => {
        // Immediately trigger render for static datasources
        if (!template.dataSource.updateFrequency) {
          this.dataSourceUpdated(template, page, metadata.name)();
          return;
        }

        this.dataSourceManager.add(
          template.dataSource,
          page.schedule,
          template.name,
          this.dataSourceUpdated(template, page, metadata.name));
      });
    });
  }

  private dataSourceUpdated(template: ITemplate, page: IDisplayTemplate, clientName: string) {
    return async () => {
      // console.log(template.name, template.dataSource.data);
      if (template.children) {
        template.children.forEach((child) => {
          this.dataSourceUpdated(child, page, clientName);
        });
      }
      if (template.renderer) {
        template.renderer.render(template.canvas, template.dataSource.data);
      }

      const compositeStart = process.hrtime();
      const output = TemplateCompositor(page.template);
      const compositeEnd = process.hrtime(compositeStart);
      Logger.info(`Execution time (composition): ${compositeEnd[0]}s ${compositeEnd[1] / 1000000}ms`);

      const exportBuffer = Buffer.from(output.getContext('2d').getImageData(0, 0, output.width, output.height).data);

      // // strip the A from RGBA[] and convert Uint8ClampedArray to Uint8Array
      // // TODO: Migrate this to client side, as that would allow RGB matrix and canvas clients
      // const rgbExportBuffer = Buffer.from(new Uint8Array(exportBuffer.filter((_: any, index: number) => (index + 1) % 4)));
      const exportKey = `rendered:${clientName}:${page.name}`;
      await this.connectionManager.redis.pipeline()
        .setBuffer(exportKey, exportBuffer)
        .publish(`${clientName}:${Events.TemplateRendered}`, exportKey)
        .exec();

      // DEBUG ONLY
      const exportStream = output.createPNGStream();
      const debugPath = path.resolve(process.cwd(), './debug', 'foo.png');
      const fileStream = fs.createWriteStream(debugPath);
      exportStream.pipe(fileStream);
    };
  }
}
