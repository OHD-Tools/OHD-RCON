import PlayerKicked from '../../definitions/PlayerKicked';
import LogParserRule from '../../definitions/RCONParserRule';

const PlayerKickFailedRule: LogParserRule<PlayerKicked> = {
  regex: /^Failed to kick specified player by (id number|name) with reason '(?<reason>.*)', no player with the (?<type>name|id number) '(?<identifier>).*' exists or the kick operation has failed!/,
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<PlayerKicked> = {} as PlayerKicked;
    response.success = false
    response.reason = args.groups?.reason
    if (args.groups?.type == 'name') {
      response.name = args.groups?.identifier
    } else {
      response.id = parseInt(args.groups?.identifier as string)
    }
    return response as PlayerKicked
  },
}
export default PlayerKickFailedRule
