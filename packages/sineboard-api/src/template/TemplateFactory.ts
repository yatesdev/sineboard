import { ITemplate, ITemplateDefinition } from '@yatesdev/sineboard-core';
import { ErrorDataSource } from '@yatesdev/sineboard-datasource-error';
import { Logger } from '@yatesdev/sineboard-log';
import { ErrorRenderer } from '@yatesdev/sineboard-renderer-error';
import { Canvas } from 'canvas';

import { DataSourceFactory } from '../datasource';
import { RendererFactory } from '../renderer';
import { moduleLoader } from '../util';

export const TemplateFactory = (root: ITemplateDefinition | string): ITemplate => {
  if (typeof root === 'string') {
    const templateModule = moduleLoader([root])[0].default;
    root = new templateModule() as ITemplate;
    return TemplateFactory(root);
  }
  if (Array.isArray(root.children)) {
    root.children.map((child) => {
      const initializedChild = TemplateFactory(child);
      initializedChild.parent = root as ITemplate;
      return initializedChild;
    });
  }

  (root as ITemplate).canvas = new Canvas(root.width, root.height);

  try {
    root.dataSource = DataSourceFactory(root.dataSource);
    root.renderer = RendererFactory(root.renderer);
  } catch (error) {
    Logger.error(`Failed to initialize ${root.dataSource.toString()}: ${error}`);
    root.dataSource = new ErrorDataSource(error);
    root.renderer = new ErrorRenderer();
  }

  return root as ITemplate;
};
