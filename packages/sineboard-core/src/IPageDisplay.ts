import { ISchedule } from './ISchedule';
import { ITemplateDefinition } from './ITemplate';

export abstract class IPageDisplay {
  name: string;
  template: ITemplateDefinition | string;
  schedule: ISchedule;
}
