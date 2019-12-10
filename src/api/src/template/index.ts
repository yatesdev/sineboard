import Redis from 'ioredis';

import { Events, ITemplate } from '@yatesdev/sineboard-core';
import { flatten, moduleLoader } from '../util';

import { Canvas } from 'canvas';
import * as fs from 'fs';

export class TemplateInitializer {
  templateListener: Redis.Redis;
  redis: Redis.Redis;

  constructor(configOverrides?: any) {
    const config = Object.assign({
      host: '127.0.0.1',
      posrt: 6379,
    }, configOverrides);

    this.redis = new Redis(config);
    this.templateListener = this.redis.duplicate();
  }

  start() {
    this.templateListener.subscribe(Events.ConfigurationLoaded);
    this.templateListener.on('message', (channel, configurationKey) => {
      this.loadClientConfiguration(configurationKey);
    });

    const canvas = new Canvas(720, 720);
    const context = canvas.getContext('2d');
    context.fillRect(0, 0, 50, 50);
    const exportBuffer = canvas.toBuffer();

    this.redis.pipeline()
      .setBuffer('exportTest', exportBuffer)
      .publish(Events.TemplateRendered, 'exportTest')
      .exec();
  }

  private async loadClientConfiguration(redisKey: string) {
    const configuration = JSON.parse(await this.redis.get(redisKey)) as ITemplate;
    // grab datasources
    flatten(configuration).map((x) => x.dataSource);
  }
}
