import Redis from 'ioredis';

export class ConnectionManager {
  redis: Redis.Redis;
  channels: Map<string, Redis.Redis>;

  constructor(configOverrides?: any) {
    const config = Object.assign({
      host: '127.0.0.1',
      posrt: 6379,
    }, configOverrides);

    this.redis = new Redis(config);
    this.channels = new Map();
  }

  subscribeToChannel(channelName: string): Redis.Redis {
    const subscriber = this.redis.duplicate();
    subscriber.subscribe(channelName);
    this.channels.set(channelName, subscriber);
    return subscriber;
  }

  subscribeToChannelPattern(channelPattern: string): Redis.Redis {
    const subscriber = this.redis.duplicate();
    subscriber.psubscribe(channelPattern);
    this.channels.set(channelPattern, subscriber);
    return subscriber;
  }
}
