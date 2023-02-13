import type OHD from '../OHD';
import VariableChanged from '../definitions/VariableChanges';
import VariableRead from '../definitions/VariableRead';
const noop = () => { }; //eslint-disable-line @typescript-eslint/no-empty-function

export interface Readable<T> {
  read: () => Promise<T>
  readDetailed: () => Promise<VariableRead>
  write: (newValue: T) => Promise<VariableChanged>
}

export function setupVariableProxy<T extends object>(controller: OHD): T {
  const path: (string | symbol)[] = [];
  const handler: ProxyHandler<T> = {
    get(target, name) {
      if (name == 'read') {
        return async () => {
          return (await controller.send(path.join('.')) as VariableRead).value;
        };
      }
      if (name == 'readDetailed') {
        return async (): Promise<VariableRead> => {
          return (await controller.send(path.join('.')) as VariableRead);
        };
      }
      if (name == 'write') {
        return async (newValue: unknown): Promise<VariableChanged> => {
          return controller.send(`${path.join('.')} ${newValue}`) as Promise<VariableChanged>;
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
