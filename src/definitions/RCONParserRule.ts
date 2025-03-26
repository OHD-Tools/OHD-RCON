import type { OHD } from '../OHD';

export interface RCONParserRule<T> {
  regex: RegExp | RegExp[];
  format: (
    args: RegExpMatchArray | RegExpMatchArray[],
    controller: OHD,
  ) => T | void;
  multiProperty?: string;
  matchAll?: boolean;
}
