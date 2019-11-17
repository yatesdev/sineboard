import { IDataSource } from 'IDataSource';
import { IRenderer } from 'IRenderer';

export abstract class ITemplate {
  name: string;
  width: number;
  height: number;
  posX: number;
  posY: number;
  dataSource: IDataSource;
  parent: ITemplate;
  children: ITemplate[];
  renderer: IRenderer;
}
