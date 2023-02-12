import PlayerKicked from '../../definitions/PlayerKicked';
import LogParserRule from '../../definitions/RCONParserRule';

const PlayerKickedRule: LogParserRule<PlayerKicked> = {
  regex: /^Player with (?<type>name|id number) '(?<identifier>.*)' was successfully kicked from the server with reason '(?<reason>.*)'/,
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<PlayerKicked> = {} as PlayerKicked;
    response.success = true
    response.reason = args.groups?.reason
    if (args.groups?.type == 'name') {
      response.name = args.groups?.identifier
    } else {
      response.id = parseInt(args.groups?.identifier as string)
    }
    return response as PlayerKicked
  },
}
export default PlayerKickedRule
