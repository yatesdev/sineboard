import { Events, Queues } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';

import config from './configuration';
import { ConnectionManager } from './ConnectionManager';
import { DisplayManager } from './DisplayManager';
import { IClientConfiguration } from './models';

export abstract class SineboardClientBase {
  private readonly connection: ConnectionManager;
  private readonly clientConfig: IClientConfiguration;
  private readonly display: DisplayManager;

  protected readonly transformers: Transformer[] = [];

  constructor(overrides?: Partial<IClientConfiguration>) {
    this.clientConfig = config;
    this.display = new DisplayManager();
    this.connection = new ConnectionManager(this.clientConfig.connection.redis);
  }

  get displayHeight() {
    return this.clientConfig.metadata.displayHeight;
  }

  get displayWidth() {
    return this.clientConfig.metadata.displayWidth;
  }

  async start() {
    Logger.info('Connecting to Redis...');
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
    const exportConfig = Object.entries(this.clientConfig).reduce((acc, kv) => {
      if (kv[0] === 'connection') { return acc; } // can I use keyof in future?
      acc[kv[0]] = JSON.stringify(kv[1]);
      return acc;
    }, Object.create(null));

    const clientKey = `client:${this.clientConfig.metadata.name}`;
    try {
      await this.connection.redis.multi()
        .sadd('clients', this.clientConfig.metadata.name)
        .hmset(clientKey, exportConfig)
        .rpush(Queues.TemplateInitialization, clientKey)
        .publish(Events.ConfigurationLoaded, clientKey)
        .exec();
    } catch (error) {
      Logger.error(error);
    }
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
