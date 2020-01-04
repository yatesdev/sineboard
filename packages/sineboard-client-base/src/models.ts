import { IDisplayTemplate } from '@yatesdev/sineboard-core';
import { RedisOptions } from 'ioredis';

export interface IClientConfiguration {
  metadata: IClientMetadata;
  connection: IClientConnectionConfiguration;
  template: IDisplayTemplate | IDisplayTemplate[];
}

export type IClientConfigurationExport = Pick<IClientConfiguration, 'metadata' | 'template'>;

export interface IClientMetadata {
  name: string;
  displayEncoding: string;
  displayWidth: number;
  displayHeight: number;
}

export interface IClientConnectionConfiguration {
  redis: RedisOptions;
}
