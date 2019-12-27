import { config } from 'dotenv';
import { resolve } from 'path';

import SineboardClient from './DebugClient';

const configPath = resolve(__dirname, './.env');
config({path: configPath});

const client = new SineboardClient();
client.start();
