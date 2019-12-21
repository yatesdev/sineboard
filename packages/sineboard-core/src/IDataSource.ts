export abstract class IDataSource {
  name: string;
  data: any;
  updateFrequency: string;
  options?: object;

  /**
   * Needs to store result to data
   */
  abstract fetch(): any;
}

export interface IDataSourceDefinition {
  name: string;
  updateFrequency?: string;
  options?: object;
}
