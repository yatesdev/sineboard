import { Canvas } from '../types/canvas';
import { IDataSource, IDataSourceDefinition } from './IDataSource';
import { IRenderer, IRendererDefinition } from './IRenderer';

export interface ITemplate {
  name: string;
  width: number;
  height: number;
  posX: number;
  posY: number;
  canvas: Canvas;
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
  parent?: ITemplateDefinition;
  children?: Array<ITemplateDefinition | string>;
}
