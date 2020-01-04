import Redis, { RedisOptions } from 'ioredis';

export class ConnectionManager {
  private readonly _channels: Map<string, Redis.Redis>;
  private readonly _redis: Redis.Redis;

  constructor(config: RedisOptions) {
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

  async subscribeToChannelPattern(channelPattern: string): Promise<Redis.Redis> {
    const subscriber = this.redis.duplicate();
    await subscriber.psubscribe(channelPattern);
    this.channels.set(channelPattern, subscriber);
    return subscriber;
  }
}
