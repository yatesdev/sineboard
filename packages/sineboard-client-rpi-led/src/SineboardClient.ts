import { EventEmitter } from 'events';
import { readFileSync } from 'fs';
import Redis, { RedisOptions } from 'ioredis';
import { resolve } from 'path';
import { GpioMapping, LedMatrix, LedMatrixUtils, PixelMapperType } from 'rpi-led-matrix';

import { Events, IPageDisplay, ITemplate } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';

export default class SineboardClient {
  config: IClientConfigurationOptions;
  redis: Redis.Redis;
  templateListener: Redis.Redis;
  pageDisplay: IPageDisplay[];
  pageStore: Map<IPageDisplay, Buffer>;
  // pageStoreEmitter: PageStoreEmitter;
  display: any;
  currentPage: {page: IPageDisplay, buffer: Buffer };
  pageDisplayGenerator: Generator;

  constructor() {
    this.config = { redis: {} } as IClientConfigurationOptions;
    this.config.name = process.env.CLIENT_NAME || 'SineboardRpiClient';
    this.config.redis.host = process.env.REDIS_HOST || '127.0.0.1';
    this.config.redis.port = parseInt(process.env.REDIS_PORT, 10) || 6379;
    Logger.debug(this.config);

    this.pageStore = new Map();

    const matrixOptions = Object.assign(LedMatrix.defaultMatrixOptions(), {
      rows: 32,
      cols: 32,
      chainLength: 4,
      hardwareMapping: GpioMapping.AdafruitHat,
      pixelMapperConfig: LedMatrixUtils.encodeMappers({ type: PixelMapperType.Rotate, angle: 180 }, { type: PixelMapperType.U }),
      pwmLsbNanoseconds: 200,
    });
    const runtimeOptions = Object.assign(LedMatrix.defaultRuntimeOptions(), {
      gpioSlowdown: 2,
    });
    this.display = new LedMatrix(matrixOptions, runtimeOptions);
    Logger.debug(`Matrix Size: ${this.display.width()} x ${this.display.height()}`);
    this.pageDisplayGenerator = this.displayLoopGenerator();

    // this.pageStoreEmitter = new PageStoreEmitter();
    // this.pageStoreEmitter.on('updated', this.displayLoop());

  }

  async start() {
    this.redis = new Redis(this.config.redis);

    this.templateListener = this.redis.duplicate();
    this.templateListener.subscribe(Events.TemplateRendered);

    this.templateListener.on('message', async (channel, key) => {
      // Is this a template this client cares about?
      const template =  this.pageDisplay.find((page) => (page.template as ITemplate).name === key);
      if (!template) { return; }

      const buffer = await this.redis.getBuffer(key);
      // force to length matrix is expecting not sure why its different atm
      const pixelArray = buffer.slice(0, this.display.width() * this.display.height() * 3);
      // handle case where not enough bytes to fill array (otherwise matrix throws a fit)
      if (pixelArray.byteLength < this.display.width() * this.display.height() * 3) { return; }

      this.pageStore.set(template, pixelArray);
      // this.pageStoreEmitter.emit('updated');

      // this.displayLoop();

      // this.display
      //   .clear()
      //   .brightness(100)
      //   .drawBuffer(pixelArray)
      //   .sync();
    });

    await this.addSelfToClientList();
    await this.loadTemplate();

    this.displayLoop();
  }

  private displayLoop() {
    if (this.pageStore.size > 0) {
      const nextPage = this.pageDisplayGenerator.next().value;
      // console.log(nextPage);
      setTimeout(() => {
        this.display
        .clear()
        .brightness(100)
        .drawBuffer(nextPage.buffer)
        .sync();

        this.displayLoop();
      }, nextPage.page.schedule.displayTime * 1000);
      this.currentPage = nextPage;

    } else {
      this.display
        .clear()
        .brightness(100)
        .fgColor({ r: 255, g: 0, b: 0 })
        .fill()
        .sync();
      setTimeout(() => {
        this.displayLoop();
      }, 5000);
    }
  }

  private addSelfToClientList(): Promise<number> {
    const result = this.redis.sadd('clients', this.config.name);
    return result;
  }

  private async loadTemplate(): Promise<void> {
    const templateKey = `template:${this.config.name}`;

    const configPath = resolve(__dirname, './config.json');
    const rawConfig = readFileSync(configPath);
    const config = JSON.parse(rawConfig.toString());

    this.pageDisplay = config;
    if (!Array.isArray(this.pageDisplay)) {
      this.pageDisplay = [this.pageDisplay];
    }

    await this.redis.pipeline()
      .set(templateKey, JSON.stringify(config))
      .publish(Events.ConfigurationLoaded, templateKey) // does this make sense or does it make more sense to just send the template?
      .exec();
  }

  private *displayLoopGenerator(): Generator<any> {
    let pages = this.pageStore.entries();
    console.log(pages);
    while (true) {
      const nextPage = pages.next();
      if (nextPage.done) {
        console.log('Reached done');
        pages = this.pageStore.entries();
        console.log(pages);
        continue;
      }
      console.log(nextPage);
      const key = nextPage.value[0];
      const value = nextPage.value[1];
      yield { page: key, buffer: value };
    }
  }
}

export interface IClientConfigurationOptions {
  name: string;
  redis: RedisOptions;
}
