import LogParserRule from '../../definitions/RCONParserRule';
import PlayerBanned from '../../definitions/PlayerBanned';

const PlayerBanFailedRule: LogParserRule<PlayerBanned> = {
  regex:
    /^Failed to ban specified player by (?<type>name|id number) with reason '(?<reason>.*)', no player with the (name|id number) '(?<identifier>.*)' exists or the ban operation failed!/,
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<PlayerBanned> = {} as PlayerBanned;
    response.success = false;
    response.reason = args.groups?.reason;
    if (args.groups?.type == 'name') {
      response.name = args.groups?.identifier;
    } else {
      response.id = parseInt(args.groups?.identifier as string);
    }
    return response as PlayerBanned;
  },
};
export default PlayerBanFailedRule;
