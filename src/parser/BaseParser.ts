import { RCONParserRule } from '../definitions/RCONParserRule';
import type { OHD } from '../OHD';
export class BaseParser {
  rules: RCONParserRule<unknown>[] = [];
  controller: OHD;
  constructor(controller: OHD, rules: RCONParserRule<unknown>[]) {
    this.controller = controller;
    this.rules = rules;
  }

  public parse(input: string): unknown {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any = undefined;
    for (const rule of this.rules) {
      const matchFunc = (input: string, reg: RegExp) => {
        if (rule.matchAll) {
          return input.matchAll(reg);
        } else {
          return input.match(reg);
        }
      };
      let match: IterableIterator<RegExpMatchArray> | RegExpMatchArray | null =
        null;
      if (Array.isArray(rule.regex)) {
        match =
          rule.regex
            .map((reg) => matchFunc(input, reg))
            .find((v) => v != null) ?? null;
      } else {
        match = matchFunc(input, rule.regex);
      }
      if (!match) continue;
      if (rule.matchAll) {
        try {
          const items = Array.from(match as IterableIterator<RegExpMatchArray>);
          if (items.length === 0) continue;
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          match = items as unknown as any;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
