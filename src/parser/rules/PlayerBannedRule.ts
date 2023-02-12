
import LogParserRule from '../../definitions/RCONParserRule';
import PlayerBanned from '../../definitions/PlayerBanned';

const PlayerBannedRule: LogParserRule<PlayerBanned> = {
  regex: /^Player with (?<type>name|id number) '(?<identifier>.*)' was successfully banned from the server with reason '(?<reason>.*)' for '(?<length>.*)' minutes/,
  format: (oargs, controller) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<PlayerBanned> = {} as PlayerBanned;
    response.success = true
    response.reason = args.groups?.reason
    if (args.groups?.type == 'name') {
      response.name = args.groups?.identifier
    } else {
      response.id = parseInt(args.groups?.identifier as string)
    }
    response.length = parseFloat(args.groups?.length as string);
    return response as PlayerBanned
  },
}
export default PlayerBannedRule
