import { PlayerKicked } from '../../definitions/PlayerKicked';
import { RCONParserRule } from '../../definitions/RCONParserRule';

export const PlayerKickedRule: RCONParserRule<PlayerKicked> = {
  regex: [
    /^(?<kickSuccess>Player with (?<type>name|id number) '(?<identifier>.*)' was successfully kicked from the server with reason '(?<reason>.*)')/,
    /^(?<kickFailed>Failed to kick specified player by (id number|name) with reason '(?<reason>.*)', no player with the (?<type>name|id number) '(?<identifier>.*)' exists or the kick operation has failed!)/,
  ],
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<PlayerKicked> = {} as PlayerKicked;
    response.success = args.groups?.kickSuccess != null;
    response.kickReason = args.groups?.reason;
    if (args.groups?.type == 'name') {
      response.name = args.groups?.identifier;
    } else {
      response.id = parseInt(args.groups?.identifier as string);
    }
    if (!response.success) response.reason = args[0];
    return response as PlayerKicked;
  },
};
