import { ISchedule } from './ISchedule';
import { ITemplate } from './ITemplate';

export interface IDisplayTemplate {
  name: string;
  template: ITemplate; // Prior to being run through TemplateFactory this is ITemplateDefinition | string. Runtime checking ?
  schedule: ISchedule;
}
