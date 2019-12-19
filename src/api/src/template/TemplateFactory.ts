import { ITemplate, ITemplateDefinition } from '@yatesdev/sineboard-core';
import { Canvas } from 'canvas';

import { DataSourceFactory } from '../datasource';
import { RendererFactory } from '../renderer';
import { moduleLoader } from '../util';

export const TemplateFactory = (root: ITemplateDefinition | string): ITemplate => {
  if (typeof root === 'string') {
    const templateModule = moduleLoader([root])[0].default;
    root = new templateModule();
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
  root.dataSource = DataSourceFactory(root.dataSource);
  if (root.renderer) {
    root.renderer = RendererFactory(root.renderer);
  }

  return root as ITemplate;
};
