import { ISchedule } from './ISchedule';
import { ITemplate } from './ITemplate';

export interface IPageDisplay {
  name: string;
  template: ITemplate; // Prior to being run through TemplateFactory this is ITemplateDefinition | string. Runtime checking ?
  schedule: ISchedule;
}
