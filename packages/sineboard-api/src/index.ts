import { ConnectionManager } from './connection';
import { DataSourceManager } from './datasource';
import { TemplateInitializer } from './template';

const connectionManager = new ConnectionManager();

const dataSourceManager = new DataSourceManager(connectionManager);
const templateListener = new TemplateInitializer(connectionManager, dataSourceManager);
templateListener.start();
