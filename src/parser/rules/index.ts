import PlayerBannedRule from './PlayerBannedRule';
import PlayerKickedRule from './PlayerKickedRule';
import PlayerPrivilegeAddRule from './PlayerPrivilegeAddRule';
import PlayerPrivilegeRemoveRule from './PlayerPrivilegeRemoveRule';
import StatusPlayerRule from './StatusPlayerRule';
import StatusRule from './StatusRule';
import VariableChangedRule from './VariableChangedRule';
import VariableReadRule from './VariableReadRule';

export default [
  StatusPlayerRule,
  StatusRule,
  PlayerKickedRule,
  PlayerBannedRule,
  VariableChangedRule,
  VariableReadRule,
  PlayerPrivilegeAddRule,
  PlayerPrivilegeRemoveRule,
];
