import * as fs from 'fs';
import Redis from 'ioredis';
import * as path from 'path';
import { GpioMapping, LedMatrix, LedMatrixUtils, PixelMapperType } from 'rpi-led-matrix';

import { Events } from '@yatesdev/sineboard-core';

export default class SineboardClient {
  config: any;
  redis: Redis.Redis;
  templateListner: Redis.Redis;

  constructor(configOverrides?: any) {
    const config = Object.assign({
      name: 'SineboardClient',
      connection: {
        redis: {
          host: '127.0.0.1',
          port: '6379',
        },
      },
    }, configOverrides);

    this.config = config;
    console.log(this.config);
  }

  async start() {
    this.redis = new Redis(this.config.connection.redis);
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
    console.log(matrix.width(), matrix.height());

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

    const configPath = path.resolve(__dirname, './config.json');
    const rawConfig = fs.readFileSync(configPath);
    const config = JSON.parse(rawConfig.toString());
    await this.redis.pipeline()
      .set(templateKey, JSON.stringify(config))
      .publish(Events.ConfigurationLoaded, templateKey) // does this make sense or does it make more sense to just send the template?
      .exec();
  }
}
