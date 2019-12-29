import { config } from 'dotenv';
import { resolve } from 'path';

import { ConnectionManager } from './connection';
import { DataSourceManager } from './datasource';
import { TemplateInitializer } from './template';

const configPath = resolve(__dirname, './.env');
config({ path: configPath });

const connectionManager = new ConnectionManager();

const dataSourceManager = new DataSourceManager(connectionManager);
const templateListener = new TemplateInitializer(connectionManager, dataSourceManager);
templateListener.start();
