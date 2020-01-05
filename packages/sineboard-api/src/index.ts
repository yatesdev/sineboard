import { config } from 'dotenv';
import { resolve } from 'path';

import { cleanupDeadClientJob, ConnectionManager } from './connection';
import { DataSourceManager } from './datasource';
import { TemplateInitializer } from './template';

const configPath = resolve(process.cwd(), './.env');
config({ path: configPath });

const connectionManager = new ConnectionManager();

const dataSourceManager = new DataSourceManager(connectionManager);
const templateListener = new TemplateInitializer(connectionManager, dataSourceManager);
templateListener.start();

cleanupDeadClientJob(connectionManager);
