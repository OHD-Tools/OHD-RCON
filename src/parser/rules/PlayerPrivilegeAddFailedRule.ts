import CommandSuccess from '../../definitions/CommandSuccess';
import LogParserRule from '../../definitions/RCONParserRule';

const PlayerPrivilegeAddFailedRule: LogParserRule<CommandSuccess> = {
  regex: [
    /^Failed to add player to admin list, player is already marked as an admin/,
    /^Failed to grant admin privileges to player by (ID number|name), no player with the (ID number|nickname) '(.*)' exists/,
  ],
  format: (oargs) => {
    const response: Partial<CommandSuccess> = {
      success: false,
      reason: oargs[0],
    } as CommandSuccess;
    return response as CommandSuccess;
  },
};
export default PlayerPrivilegeAddFailedRule;
