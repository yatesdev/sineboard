import { IDataSource } from './IDataSource';
import { IRenderer } from './IRenderer';

export abstract class ITemplateV1 {
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

// tslint:disable-next-line:max-classes-per-file
export abstract class ITemplateDefinition {
  name: string;
  width: number;
  height: number;
  posX: number;
  posY: number;
  dataSource: IDataSource | string;
  renderer: (() => void) | string;
  parent?: ITemplate;
  children?: Array<ITemplate | string>;
}
// tslint:disable-next-line:max-classes-per-file
export abstract class ITemplate {
  name: string;
  width: number;
  height: number;
  posX: number;
  posY: number;
  dataSource: IDataSource;
  renderer: string;
  parent?: ITemplate;
  children?: ITemplate[];
}

// tslint:disable-next-line:max-classes-per-file
export abstract class ISchedule {
  startDate: string;
  endDate: string;
  displayTime: number;
}

// tslint:disable-next-line:max-classes-per-file
export abstract class IPageDisplay {
  name: string;
  template: ITemplate;
  schedule: ISchedule;
}
