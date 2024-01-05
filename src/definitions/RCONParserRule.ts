import type OHD from '../OHD';

export default interface RCONParserRule<T> {
  regex: RegExp | RegExp[];
  format: (
    args: RegExpMatchArray | RegExpMatchArray[],
    controller: OHD,
  ) => T | void;
  multiProperty?: string;
  matchAll?: boolean;
}
