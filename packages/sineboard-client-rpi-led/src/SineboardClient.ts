import { readFileSync } from 'fs';
import Redis, { RedisOptions } from 'ioredis';
import { resolve } from 'path';
import { GpioMapping, LedMatrix, LedMatrixUtils, PixelMapperType } from 'rpi-led-matrix';

import { Events } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';

export default class SineboardClient {
  config: IClientConfigurationOptions;
  redis: Redis.Redis;
  templateListner: Redis.Redis;

  constructor() {
    this.config = { redis: {} } as IClientConfigurationOptions;
    this.config.name = process.env.CLIENT_NAME || 'SineboardRpiClient';
    this.config.redis.host = process.env.REDIS_HOST || '127.0.0.1';
    this.config.redis.port = parseInt(process.env.REDIS_PORT, 10) || 6379;
    Logger.debug(this.config);
  }

  async start() {
    this.redis = new Redis(this.config.redis);

    this.templateListner = this.redis.duplicate();
    this.templateListner.subscribe(Events.TemplateRendered);

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

    const matrix = new LedMatrix(matrixOptions, runtimeOptions);
    Logger.debug(matrix.width(), matrix.height());

    this.templateListner.on('message', async (channel, key) => {
      const buffer = await this.redis.getBuffer(key);
      // force to length matrix is expecting not sure why its different atm
      const pixelArray = buffer.slice(0, matrix.width() * matrix.height() * 3);
      // handle case where not enough bytes to fill array (otherwise matrix throws a fit)
      if (pixelArray.byteLength < matrix.width() * matrix.height() * 3) { return; }

      matrix
        .clear()
        .brightness(100)
        .drawBuffer(pixelArray)
        .sync();
    });
    await this.addSelfToClientList();
    await this.loadTemplate();
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
    await this.redis.pipeline()
      .set(templateKey, JSON.stringify(config))
      .publish(Events.ConfigurationLoaded, templateKey) // does this make sense or does it make more sense to just send the template?
      .exec();
  }
}

export interface IClientConfigurationOptions {
  name: string;
  redis: RedisOptions;
}
