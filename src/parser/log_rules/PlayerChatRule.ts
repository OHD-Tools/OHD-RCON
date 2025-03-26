import { PlayerChat } from '../../definitions/PlayerChat';
import { RCONParserRule } from '../../definitions/RCONParserRule';

export const PlayerChatRule: RCONParserRule<{
  type: 'chat';
  data: PlayerChat;
}> = {
  regex:
    /\[(?<timestamp>.*)\]\[[\s\d]{3}\]LogChat: \[(?<channel>.*)\] .*\((?<player_id>765\d{14})\): (?<message>.*)/,
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<PlayerChat> = {} as PlayerChat;

    response.time = new Date(args.groups?.timestamp as string);
    response.channel = args.groups?.channel;
    response.player_id = args.groups?.player_id as string;
    response.message = args.groups?.message as string;

    return { type: 'chat', data: response as PlayerChat };
  },
};
