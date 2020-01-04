import Redis, { RedisOptions } from 'ioredis';

export class ConnectionManager {
  private readonly _channels: Map<string, Redis.Redis>;
  private readonly _redis: Redis.Redis;

  constructor(configOverrides?: RedisOptions) {
    const config = Object.assign({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    }, configOverrides);

    this._redis = new Redis(config);
    this._channels = new Map();
  }

  get redis() {
    return this._redis;
  }
  get channels() {
    return this._channels;
  }

  async subscribeToChannel(channelName: string): Promise<Redis.Redis> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(channelName);
    this.channels.set(channelName, subscriber);
    return subscriber;
  }
}
