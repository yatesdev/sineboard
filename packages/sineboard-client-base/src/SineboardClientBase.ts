import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { RedisOptions } from 'ioredis';
import { resolve } from 'path';

import { Events, IPageDisplay, Queues } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';

import { ConnectionManager } from './ConnectionManager';
import { DisplayManager } from './DisplayManager';

export abstract class SineboardClientBase {
  private readonly connection: ConnectionManager;
  private readonly clientConfig: IClientConfigurationOptions;
  private readonly display: DisplayManager;

  constructor(overrides?: IClientConfigurationOptions) {
    const configPath = resolve(__dirname, './.env');
    config({path: configPath});

    this.clientConfig = { redis: {} } as IClientConfigurationOptions;
    this.clientConfig.name = process.env.CLIENT_NAME || 'SineboardClient';
    this.clientConfig.redis.host = process.env.REDIS_HOST || '127.0.0.1';
    this.clientConfig.redis.port = parseInt(process.env.REDIS_PORT, 10) || 6379;

    this.clientConfig = Object.assign(this.clientConfig, overrides);
    Logger.debug(this.clientConfig);

    Logger.info('Connecting to Redis...');
    this.connection = new ConnectionManager(this.clientConfig.redis);
    Logger.info('Done!');

    this.display = new DisplayManager();
  }

  get templateHeight() {
    return this.display.maxHeight;
  }

  get templateWidth() {
    return this.display.maxWidth;
  }

  async start() {
    await this.connection.subscribeToChannel(Events.TemplateRendered);
    this.connection.channels.get(Events.TemplateRendered).on('message', this.onTemplateRendered);

    await this.registerSelf();

    this.displayLoop();
  }

  private displayLoop() {
    if (this.display.any()) {
      const nextScreen = this.display.next().value;
      setTimeout(() => {
        this.onDisplay(nextScreen.buffer);
        this.displayLoop();
      }, nextScreen.page.schedule.displayTime * 1000);
    } else {
      this.onEmptyDisplay();
      setTimeout(() => {
        this.displayLoop();
      }, 5000);
    }
  }

  private async registerSelf() {
    const templateKey = `template:${this.clientConfig.name}`;
    const template = this.loadTemplate();

    await this.connection.redis.pipeline()
      .sadd('clients', this.clientConfig.name) // TODO: Add Unique Identifier to client name
      .set(templateKey, template)
      .rpush(Queues.TemplateInitialization, templateKey)
      .publish(Events.ConfigurationLoaded, templateKey)
      .exec();
  }

  private loadTemplate(path = './config.json'): string {
    const configPath = resolve(__dirname, path);
    const rawConfig = readFileSync(configPath);
    let parsedConfig = JSON.parse(rawConfig.toString()) as IPageDisplay | IPageDisplay[];

    if (!Array.isArray(parsedConfig)) {
      parsedConfig = [parsedConfig];
    }
    parsedConfig.forEach((template) => {
      this.display.set(template);
    });

    return JSON.stringify(parsedConfig);
  }

  async onTemplateRendered(_: string, key: string) {
    const template = this.display.getByTemplateName(key);
    if (!template) { return; }

    const buffer = await this.connection.redis.getBuffer(key);
    // transormation pipeline (buffer)

    this.display.set(template.template, buffer);
  }

  // /**
  //  * Transformation pipeline to help manipulate the rendered template into a format suitable for the client
  //  */
  // abstract transforms<T extends any[], R>( fn1: (...args: T) => R, ...fns: Array<(a: R) => R>): T;
  abstract onDisplay(display: any): void;
  abstract onEmptyDisplay(): void;
}

export interface IClientConfigurationOptions {
  name: string;
  redis: RedisOptions;
}
