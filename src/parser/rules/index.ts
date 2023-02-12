import PlayerBanFailedRule from './PlayerBanFailedRule';
import PlayerBannedRule from './PlayerBannedRule';
import PlayerKickFailedRule from './PlayerKickFailedRule';
import PlayerKickedRule from './PlayerKickedRule';
import StatusPlayerRule from './StatusPlayerRule';
import StatusRule from './StatusRule';
import VariableChangedRule from './VariableChangedRule';
import VariableReadRule from './VariableReadRule';

export default [
  StatusPlayerRule,
  StatusRule,
  PlayerKickedRule,
  PlayerKickFailedRule,
  PlayerBannedRule,
  PlayerBanFailedRule,
  VariableChangedRule,
  VariableReadRule
];
