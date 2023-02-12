import RCONParserRule from '../definitions/RCONParserRule';
import { default as rules } from './rules';
import type OHD from '../OHD';
export default class RCONParser {
  rules: RCONParserRule<unknown>[] = [...rules];
  controller: OHD
  constructor(controller: OHD) {
    this.controller = controller
    //Do Thing
  }

  public parse(input: string): unknown {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any = undefined
    for (const rule of this.rules) {
      let match: IterableIterator<RegExpMatchArray> | RegExpMatchArray | null
      if (rule.matchAll) {
        match = input.matchAll(rule.regex)
      } else {
        match = input.match(rule.regex);
      }
      if (!match) continue;
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = rule.format(match as any, this.controller);
      if (rule.multiProperty) {
        if (response == undefined) {
          response = {}
        }
        Reflect.set(response, rule.multiProperty, res)
        continue
      }
      response = res;
      break
    }
    return response;
  }
}
