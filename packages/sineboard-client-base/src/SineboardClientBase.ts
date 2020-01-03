import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { RedisOptions } from 'ioredis';
import { resolve } from 'path';

import { Events, Queues } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';

import { ConnectionManager } from './ConnectionManager';
import { DisplayManager } from './DisplayManager';

export abstract class SineboardClientBase {
  private readonly connection: ConnectionManager;
  private readonly config: IClientConfigurationOptions;
  private readonly display: DisplayManager;

  constructor(overrides?: IClientConfigurationOptions) {
    const configPath = resolve(__dirname, './.env');
    config({path: configPath});

    this.config = { redis: {} } as IClientConfigurationOptions;
    this.config.name = process.env.CLIENT_NAME || 'SineboardClient';
    this.config.redis.host = process.env.REDIS_HOST || '127.0.0.1';
    this.config.redis.port = parseInt(process.env.REDIS_PORT, 10) || 6379;

    this.config = Object.assign(this.config, overrides);
    Logger.debug(this.config);

    Logger.info('Connecting to Redis...');
    this.connection = new ConnectionManager(this.config.redis);
    Logger.info('Done!');

    this.display = new DisplayManager();
  }

  async start() {
    await this.connection.subscribeToChannel(Events.TemplateRendered);
    this.connection.channels.get(Events.TemplateRendered).on('message', this.onTemplateRendered);

    await this.registerSelf();

    this.displayLoop();
  }

  displayLoop() {
    if (this.display.any()) {
      const nextScreen = this.display.next().value;
      setTimeout(() => {
        this.onDisplay(nextScreen)
        this.displayLoop()
      }, 1000) //TODO: Change to use the configs displayTime
    } else {
      this.onEmptyDisplay();
      setTimeout(() => {
        this.displayLoop()
      }, 5000)
    }
  }

  private async registerSelf() {
    const templateKey = `template:${this.config.name}`;
    const template = this.loadTemplate();

    await this.connection.redis.pipeline()
      .sadd('clients', this.config.name) // TODO: Add Unique Identifier to client name
      .set(templateKey, template)
      .rpush(Queues.TemplateInitialization, templateKey)
      .publish(Events.ConfigurationLoaded, templateKey)
      .exec();
  }

  private loadTemplate(path = './config.json'): string {
    const configPath = resolve(__dirname, path);
    const rawConfig = readFileSync(configPath);
    return JSON.stringify(JSON.parse(rawConfig.toString()));
  }

  abstract onTemplateRendered(_: string, key: string): void;
  abstract onDisplay(display: any): void;
  abstract onEmptyDisplay(): void
}

export interface IClientConfigurationOptions {
  name: string;
  redis: RedisOptions;
}
