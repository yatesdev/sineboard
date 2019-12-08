export abstract class IDataSource {
  name: string;
  data: any;
  updateFrequency: number;
  options?: object;

  /**
   * Needs to store result to data
   */
  abstract fetch(): any;
}
