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
    this.clientConfig = Object.assign(config, overrides);
    this.display = new DisplayManager();
    this.connection = new ConnectionManager(this.clientConfig.connection.redis);

    this.clientConfig.template.forEach((displayTemplate) => {
      this.display.set(displayTemplate, null);
    });
  }

  get displayHeight() {
    return this.clientConfig.metadata.displayHeight;
  }

  get displayWidth() {
    return this.clientConfig.metadata.displayWidth;
  }

  async start() {
    Logger.info(`Starting Client: ${this.clientConfig.metadata.name}...`);
    Logger.info('Connecting to Redis...');
    const conn = await this.connection.subscribeToChannelPattern(`${this.clientConfig.metadata.name}:*`);
    conn.on('pmessage', (pattern: string, channel: string, message) => {
      switch (channel.split(':').slice(-1)[0]) {
        case Events.TemplateRendered:
          this.onTemplateRendered(channel, message);
          break;
      }
    });

    Logger.info('Registering with Sineboard API...');
    await this.registerSelf();

    Logger.info('Starting Display...');
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
    // TODO: Extract and make less specific
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
    // TODO: Figure out a better way to map the template to the rendered buffer
    const template = this.display.getByTemplateName(key.split(':').splice(-1)[0]);
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
