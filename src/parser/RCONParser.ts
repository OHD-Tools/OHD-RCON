import RCONParserRule from '../definitions/RCONParserRule';
import { default as rules } from './rules';
import type OHD from '../OHD';
export default class RCONParser {
  rules: RCONParserRule<unknown>[] = [...rules];
  controller: OHD;
  constructor(controller: OHD) {
    this.controller = controller;
    //Do Thing
  }

  public parse(input: string): unknown {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any = undefined;
    for (const rule of this.rules) {
      let matchFunc: typeof input.match | typeof input.matchAll;
      if (rule.matchAll) {
        matchFunc = input.matchAll;
      } else {
        matchFunc = input.match;
      }
      let match: IterableIterator<RegExpMatchArray> | RegExpMatchArray | null =
        null;
      if (Array.isArray(rule.regex)) {
        match =
          rule.regex
            .map((reg) => {
              const res = matchFunc(reg);
              return res;
            })
            .find((v) => v != null) ?? null;
      } else {
        match = matchFunc(rule.regex);
      }
      if (!match) continue;
      if (rule.matchAll) {
        try {
          const items = Array.from(match as IterableIterator<RegExpMatchArray>);
          if (items.length === 0) continue;
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          match = items as unknown as any;
        } catch (error) {
          // Ignore
        }
      }
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = rule.format(match as any, this.controller);
      if (rule.multiProperty) {
        if (response == undefined) {
          response = {};
        }
        Reflect.set(response, rule.multiProperty, res);
        continue;
      }
      response = res;
      break;
    }
    return response;
  }
}
