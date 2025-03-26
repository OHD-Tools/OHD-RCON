import { rules } from './rcon_rules';
import type { OHD } from '../OHD';
import { BaseParser } from './BaseParser';
export class RCONParser extends BaseParser {
  constructor(controller: OHD) {
    super(controller, rules);
  }
}
