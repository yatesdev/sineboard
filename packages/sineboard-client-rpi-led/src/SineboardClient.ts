import { RedisOptions } from 'ioredis';
import { GpioMapping, LedMatrix, LedMatrixUtils, PixelMapperType } from 'rpi-led-matrix';

import { SineboardClientBase } from '@yatesdev/sineboard-client-base';
import { Logger } from '@yatesdev/sineboard-log';

export default class SineboardClient extends SineboardClientBase {
  ledMatrix: any;

  constructor() {
    super();
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
    this.ledMatrix = new LedMatrix(matrixOptions, runtimeOptions);
    Logger.debug(`Matrix Size: ${this.ledMatrix.width()} x ${this.ledMatrix.height()}`);
  }

  onDisplay(buffer: Buffer) {
    this.ledMatrix
      .clear()
      .brightness(100)
      .drawBuffer(buffer)
      .sync();
  }

  onEmptyDisplay(): void {
    this.ledMatrix
      .clear()
      .brightness(100)
      .fgColor({ r: 255, g: 0, b: 0 })
      .fill()
      .sync();
  }
}

export interface IClientConfigurationOptions {
  name: string;
  redis: RedisOptions;
}
