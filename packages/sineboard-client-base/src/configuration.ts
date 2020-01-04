import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import shortId from 'shortid';

import { IDisplayTemplate } from '@yatesdev/sineboard-core';
import { IClientConfiguration } from './models';

const envPath = path.resolve(process.cwd(), './.env');
const templatePath = path.resolve(process.cwd(), './config.json');

dotenv.config({ path: envPath });

const configuration: IClientConfiguration = {
  metadata: {
    name: `${process.env.CLIENT_NAME || 'SineboardClient'}-${shortId.generate()}`,
    displayEncoding: process.env.DISPLAY_ENCODING || 'RGBA32',
    displayWidth: parseInt(process.env.DISPLAY_WIDTH, 10) || 0,
    displayHeight: parseInt(process.env.DISPLAY_HEIGHT, 10) || 0,
  },
  connection: {
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    },
  },
  template: loadDisplayTemplate(),
};

function loadDisplayTemplate() {
  const rawConfig = fs.readFileSync(templatePath);
  let displayTemplate = JSON.parse(rawConfig.toString()) as IDisplayTemplate | IDisplayTemplate[];

  if (!Array.isArray(displayTemplate)) {
    displayTemplate = [displayTemplate];
  }

  return displayTemplate;
}

export default configuration;
