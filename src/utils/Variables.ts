import type OHD from '../OHD';
import { ServerVariables } from '../definitions/ServerVariables';
import VariableRead from '../definitions/VariableRead';
const noop = () => { }; //eslint-disable-line @typescript-eslint/no-empty-function

export interface Readable<T> {
  read: () => Promise<T>
  write: (newValue: T) => Promise<T>
}

export function setupVariableProxy(controller: OHD) {
  const path: (string | symbol)[] = [];
  const handler: ProxyHandler<ServerVariables> = {
    get(target, name) {
      if (name == 'read') {
        return async () => {
          return (await controller.send(path.join('.')) as VariableRead).value;
        };
      }
      if (name == 'write') {
        return async (newValue: unknown) => {
          controller.send(`${path.join('.')} ${newValue}`);
          return newValue;
        };
      }
      path.push(name);

      return new Proxy(noop as unknown as ServerVariables, handler);
    },
    set(target, name, newValue) {
      path.push(name);
      controller.send(`${path.join('.')} ${newValue}`);
      return true;
    }
  };
  return new Proxy(noop as unknown as ServerVariables, handler);
}
