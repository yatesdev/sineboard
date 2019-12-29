import * as fs from 'fs';
import { join } from 'path';
export * from './TextRenderer';

// tslint:disable-next-line:no-var-requires
const { registerFont } = module.parent.require('canvas');
const fontPath = join(__dirname, './assets');

fs.readdirSync(fontPath).forEach((file) => {
  console.log(file);
  const fontName = RegExp('^([^.ttf]+)').exec(file)[0];
  console.log(fontName);
  registerFont( join(fontPath, file), { family: fontName});
});
