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

  protected readonly transformers: Transformer[] = [];

  constructor(overrides?: Partial<IClientConfigurationOptions>) {
    const configPath = resolve(process.cwd(), './.env');
    config({path: configPath});

    this.clientConfig = {
      name: process.env.CLIENT_NAME || 'SineboardClient',
      redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      },
    };

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
    this.connection.channels.get(Events.TemplateRendered).on('message', this.onTemplateRendered.bind(this));

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
    const configPath = resolve(process.cwd(), path);
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
    const template = this.display.getByTemplateName(key.split(':', 1)[1]);
    if (!template) { return; }

    const buffer = await this.connection.redis.getBuffer(key);

    let outputBuffer = buffer;
    if (this.transformers.length > 0) {
      outputBuffer = pipe<any, Buffer>(...(this.transformers) as [Transformer, Transformer])(buffer);
    }

    this.display.set(template.template, outputBuffer);
  }

  abstract onDisplay(display: any): void;
  abstract onEmptyDisplay(): void;
}

type Transformer = (args: Buffer, ...rest: any) => Buffer;
interface IClientConfigurationOptions {
  name: string;
  redis: RedisOptions;
}

const pipe = <T extends any[], R>(
  fn1: (...args: T) => R,
  ...fns: Array<(a: R) => R>
) => {
  const piped = fns.reduce(
    (prevFn, nextFn) => (value: R) => nextFn(prevFn(value)),
    (value) => value,
  );
  return (...args: T) => piped(fn1(...args));
};
