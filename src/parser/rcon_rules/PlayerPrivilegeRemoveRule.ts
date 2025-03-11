import CommandSuccess from '../../definitions/CommandSuccess';
import LogParserRule from '../../definitions/RCONParserRule';

const PlayerPrivilegeRemoveRule: LogParserRule<CommandSuccess> = {
  regex: [
    /^(?<removeSuccess>Player was revoked of their admin privileges)/,
    /^(?<removeFailed>Failed to remove player from admin list, player is not an admin)/,
    /^(?<removeFailed>Failed to revoke admin privileges from player by (ID number|name), no player with the (ID number|nickname) '(.*)' exists)/,
  ],
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<CommandSuccess> = {} as CommandSuccess;
    response.success = args.groups?.removeSuccess != null;
    if (!response.success) response.reason = args[0];
    return response as CommandSuccess;
  },
};
export default PlayerPrivilegeRemoveRule;
