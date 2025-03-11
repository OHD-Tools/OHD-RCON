import { default as rules } from './rcon_rules';
import type OHD from '../OHD';
import BaseParser from './BaseParser';
export default class RCONParser extends BaseParser {
  constructor(controller: OHD) {
    super(controller, rules);
  }
}
