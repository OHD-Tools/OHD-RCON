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
      let match: IterableIterator<RegExpMatchArray> | RegExpMatchArray | null =
        null;
      if (rule.matchAll) {
        if (Array.isArray(rule.regex)) {
          match =
            rule.regex
              .map((reg) => {
                const res = input.matchAll(reg);
                return res;
              })
              .find((v) => v != null) ?? null;
        } else {
          match = input.matchAll(rule.regex);
        }
      } else {
        if (Array.isArray(rule.regex)) {
          match =
            rule.regex
              .map((reg) => {
                const res = input.match(reg);
                return res;
              })
              .find((v) => v != null) ?? null;
        } else {
          match = input.match(rule.regex);
          if (this.controller.debug)
            console.info(
              `Regex: ${rule.regex}\ninput: ${input}\nMatch: ${match}`,
            );
        }
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
