import { PlayerBannedRule } from './PlayerBannedRule';
import { PlayerKickedRule } from './PlayerKickedRule';
import { PlayerPrivilegeRemoveRule } from './PlayerPrivilegeRemoveRule';
import { PlayerPrivilegeAddRule } from './PlayerPrivilegeAddRule';
import { StatusPlayerRule } from './StatusPlayerRule';
import { StatusRule } from './StatusRule';
import { VariableChangedRule } from './VariableChangedRule';
import { VariableReadRule } from './VariableReadRule';

export const rules = [
  StatusPlayerRule,
  StatusRule,
  PlayerKickedRule,
  PlayerBannedRule,
  VariableChangedRule,
  VariableReadRule,
  PlayerPrivilegeRemoveRule,
  PlayerPrivilegeAddRule,
];
