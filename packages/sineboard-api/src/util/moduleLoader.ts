import { readdirSync } from 'fs';
import { isObject, isString } from 'lodash';
import { join, normalize } from 'path';

const IGNORED_PACKAGES: string[] = [];

export default function resolve(plugins: string[], emitter?: any) {
  const modules: any[] = [];
  // console.log(plugins);

  function requirePlugin(name: string) {
    console.log(name);
    try {
      modules.push(require(name));
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND' && e.message.includes(name)) {
        console.error(`Cannot find plugin "${name}".\n  Did you forget to install it?\n  npm install ${name} --save`);
      } else {
        // log.error(`Error during loading "${name}" plugin:\n  ${e.message}`)
      }
      // emitter.emit('load_error', 'plug_in', name);
    }
  }

  plugins.forEach((plugin: string) => {
    if (isString(plugin)) {
      if (!plugin.includes('*')) {
        requirePlugin(plugin);
        return;
      }
      // console.log(__dirname);
      const pluginDirectory = normalize(join(__dirname, '/../..'));
      const regexp = new RegExp(`^${plugin.replace('*', '.*')}`);

      console.log(`Loading ${plugin} from ${pluginDirectory}`);
      readdirSync(pluginDirectory)
        .filter((pluginName: string) => !IGNORED_PACKAGES.includes(pluginName) && regexp.test(pluginName))
        .forEach((pluginName: string) => requirePlugin(`${pluginDirectory}/${pluginName}`));
    } else if (isObject(plugin)) {
      console.log(`Loading inlined plugin (defining ${Object.keys(plugin).join(', ')}).`);
      modules.push(plugin);
    } else {
      console.error(`Invalid plugin ${plugin}`);
      // emitter.emit('load_error', 'plug_in', plugin);
    }
  });

  return modules;
}
