import { IDataSource, IDataSourceDefinition } from './IDataSource';
import { IRenderer, IRendererDefinition } from './IRenderer';

export abstract class ITemplate {
  name: string;
  width: number;
  height: number;
  posX: number;
  posY: number;
  canvas: import('../types/canvas').Canvas;
  dataSource: IDataSource;
  renderer: IRenderer;
  parent?: ITemplate;
  children?: ITemplate[];
}

export interface ITemplateDefinition {
  name: string;
  width: number;
  height: number;
  posX: number;
  posY: number;
  dataSource: IDataSourceDefinition | string;
  renderer: IRendererDefinition | string;
  parent?: ITemplate;
  children?: Array<ITemplate | string>;
}
