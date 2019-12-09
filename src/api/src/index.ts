import { ITemplate } from '@yatesdev/sineboard-core';
import { TemplateInitializer } from './template';
import { flatten } from './util';

const templateListener = new TemplateInitializer();
templateListener.start();
