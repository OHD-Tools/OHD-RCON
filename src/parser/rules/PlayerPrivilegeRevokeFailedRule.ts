import CommandSuccess from '../../definitions/CommandSuccess';
import LogParserRule from '../../definitions/RCONParserRule';

const PlayerPrivilegeRevokeFailedRule: LogParserRule<CommandSuccess> = {
  regex: [
    /^Failed to remove player from admin list, player is not an admin/,
    /^Failed to revoke admin privileges from player by (ID number|name), no player with the (ID number|nickname) '(.*)' exists/,
  ],
  format: (oargs) => {
    const response: Partial<CommandSuccess> = {
      success: false,
      reason: oargs[0],
    } as CommandSuccess;
    return response as CommandSuccess;
  },
};
export default PlayerPrivilegeRevokeFailedRule;
