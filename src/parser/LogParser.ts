import { default as rules } from './log_rules';
import type OHD from '../OHD';
import BaseParser from './BaseParser';
export default class LogParser extends BaseParser {
  constructor(controller: OHD) {
    super(controller, rules);
  }
}
