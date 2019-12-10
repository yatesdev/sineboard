import { ITemplate } from '@yatesdev/sineboard-core';
import { ConnectionManager } from './connection';
import { TemplateInitializer } from './template';
import { flatten } from './util';

const connectionManager = new ConnectionManager();

const templateListener = new TemplateInitializer(connectionManager);
templateListener.start();
