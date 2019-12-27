import { readFileSync } from 'fs';
import Redis, { RedisOptions } from 'ioredis';
import { resolve } from 'path';

import { Events } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';

export default class DebugClient {
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
