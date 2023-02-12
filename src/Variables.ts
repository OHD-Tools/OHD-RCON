import type OHD from './OHD';
import { Teams } from './Teams';
import VariableRead from './definitions/VariableRead';
const noop = () => { }; //eslint-disable-line @typescript-eslint/no-empty-function

interface Readable<T> {
  read: () => Promise<T>
  write: (newValue: T) => Promise<T>
}
type bit = '0' | '1'

export interface OHDVariables {
  Game: {
    FriendlyFire: Readable<bit>;
    AutoBalanceTeamsOverride: Readable<bit>;
    AutoAssignHumanTeam: Readable<bit | '-1'>;
  }
  Bot: {
    Autofill: Readable<bit>;
  }
  Net: {
    MinPlayersOverride: Readable<`${number}`>;
    MaxPlayersOverride: Readable<`${number}`>;
  }
}

export function setupVariableProxy(controller: OHD) {
  const path: (string | symbol)[] = [];
  const handler: ProxyHandler<OHDVariables> = {
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

      return new Proxy(noop as unknown as OHDVariables, handler);
    },
    set(target, name, newValue) {
      path.push(name);
      controller.send(`${path.join('.')} ${newValue}`);
      return true;
    }
  };
  return new Proxy(noop as unknown as OHDVariables, handler);
}
