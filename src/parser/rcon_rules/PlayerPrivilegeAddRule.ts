import { CommandSuccess } from '../../definitions/CommandSuccess';
import { RCONParserRule } from '../../definitions/RCONParserRule';

export const PlayerPrivilegeAddRule: RCONParserRule<CommandSuccess> = {
  regex: [
    /^(?<addSuccess>Player was successfully granted admin privileges)/,
    /^(?<addFailed>Failed to add player to admin list, player is already marked as an admin)/,
    /^(?<addFailed>Failed to grant admin privileges to player by (ID number|name), no player with the (ID number|nickname) '(.*)' exists)/,
  ],
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<CommandSuccess> = {} as CommandSuccess;
    response.success = args.groups?.addSuccess != null;
    if (!response.success) response.reason = args[0];
    return response as CommandSuccess;
  },
};
