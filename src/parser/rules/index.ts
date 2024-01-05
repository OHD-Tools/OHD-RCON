import PlayerBanFailedRule from './PlayerBanFailedRule';
import PlayerBannedRule from './PlayerBannedRule';
import PlayerKickFailedRule from './PlayerKickFailedRule';
import PlayerKickedRule from './PlayerKickedRule';
import PlayerPrivilegeAddFailedRule from './PlayerPrivilegeAddFailedRule';
import PlayerPrivilegeAddRule from './PlayerPrivilegeAddRule';
import PlayerPrivilegeRevokeFailedRule from './PlayerPrivilegeRevokeFailedRule';
import PlayerPrivilegeRevokeRule from './PlayerPrivilegeRevokeRule';
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
  VariableReadRule,
  PlayerPrivilegeAddFailedRule,
  PlayerPrivilegeAddRule,
  PlayerPrivilegeRevokeFailedRule,
  PlayerPrivilegeRevokeRule,
];
