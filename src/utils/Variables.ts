import type OHD from '../OHD';
import VariableRead from '../definitions/VariableRead';
const noop = () => { }; //eslint-disable-line @typescript-eslint/no-empty-function

export interface Readable<T> {
  read: () => Promise<T>
  write: (newValue: T) => Promise<T>
}

export function setupVariableProxy<T extends Object>(controller: OHD): T {
  const path: (string | symbol)[] = [];
  const handler: ProxyHandler<T> = {
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

      return new Proxy(noop as unknown as T, handler);
    },
    set(target, name, newValue) {
      path.push(name);
      controller.send(`${path.join('.')} ${newValue}`);
      return true;
    }
  };
  return new Proxy(noop as unknown as T, handler);
}
