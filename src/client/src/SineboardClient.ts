import * as fs from 'fs';
import Redis from 'ioredis';
import * as path from 'path';

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

    this.templateListner.on('message', async (channel, key) => {
      const buffer = await this.redis.getBuffer(key);
      console.log(buffer);
    });
    await this.addSelfToClientList();
    await this.loadTemplate();
  }

  private addSelfToClientList(): Promise<number> {
    const result = this.redis.sadd('clients', this.config.name);
    return result;
  }

  private async loadTemplate(): Promise<void> {
    const templateKey = `${this.config.name}:template`;

    const configPath = path.resolve(__dirname, './config.json');
    const rawConfig = fs.readFileSync(configPath);
    const config = JSON.parse(rawConfig.toString());
    await this.redis.pipeline()
      .set(templateKey, JSON.stringify(config))
      .publish(Events.ConfigurationLoaded, templateKey) // does this make sense or does it make more sense to just send the template?
      .exec();
  }
}
