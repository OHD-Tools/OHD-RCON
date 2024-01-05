import LogParserRule from '../../definitions/RCONParserRule';
import PlayerBanned from '../../definitions/PlayerBanned';

const PlayerBannedRule: LogParserRule<PlayerBanned> = {
  regex: [
    /^(?<banSuccess>Player with (?<type>name|id number) '(?<identifier>.*)' was successfully banned from the server with reason '(?<reason>.*)' for '(?<length>.*)' minutes)/,
    /^(?<banFailed>Failed to ban specified player by (?<type>name|id number) with reason '(?<reason>.*)', no player with the (name|id number) '(?<identifier>.*)' exists or the ban operation has failed!)/,
  ],
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<PlayerBanned> = {} as PlayerBanned;
    response.success = args.groups?.banSuccess != null;
    response.banReason = args.groups?.reason;
    if (args.groups?.type == 'name') {
      response.name = args.groups?.identifier;
    } else {
      response.id = parseInt(args.groups?.identifier as string);
    }
    if (response.success)
      response.length = parseFloat(args.groups?.length as string);
    if (!response.success) response.reason = args[0];
    return response as PlayerBanned;
  },
};
export default PlayerBannedRule;
