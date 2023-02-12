import Player from '../../Player';
import LogParserRule from '../../definitions/RCONParserRule';
const StatusPlayerRule: LogParserRule<Player[]> = {
  regex: /(?<Player_ID>\d+)\t(?<Name>.+)\s+(?<Steam64>BOT|(?:765\d{14}))/gm,
  matchAll: true,
  format: (oargs, controller) => {
    const args = oargs as IterableIterator<RegExpMatchArray>;
    const response: Player[] = []
    for (const match of args) {
      response.push(
        new Player(controller, {
          id: parseInt(match.groups?.Player_ID as string),
          name: match.groups?.Name?.trim() as string,
          steam64:
            match.groups?.Steam64 != 'BOT' ? match.groups?.Steam64 as string : null,
        })
      );
    }
    return response
  },
  multiProperty: 'players'
}
export default StatusPlayerRule
