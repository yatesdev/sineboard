import Redis from 'ioredis';

import { Events, ITemplate } from '@yatesdev/sineboard-core';
import { flatten, moduleLoader } from '../util';

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
  }

  private async loadClientConfiguration(redisKey: string) {
    const configuration = JSON.parse(await this.redis.get(redisKey)) as ITemplate;
    flatten(configuration);
  }
}
