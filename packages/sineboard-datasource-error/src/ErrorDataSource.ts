import { IDataSource } from '@yatesdev/sineboard-core';

export class ErrorDataSource implements IDataSource {
  name = 'ErrorDataSource';
  data: any;
  updateFrequency = '0 */1 * * * *';

  constructor(error: string) {
    this.data = error;
  }

  fetch() {}
}
