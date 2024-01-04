import LogParserRule from '../../definitions/RCONParserRule';
import ServerStatus from '../../definitions/ServerStatus';

const StatusRule: LogParserRule<unknown> = {
  regex:
    /Server Name: (?<Server_Name>.*)\nLocal Address: (?<Local_Address>.*)\nMap: (?<Map>.*)\nGame Mode: (?<Game_Mode>.*) \[(?<Game_Mode_Class>.*)\]\nIs In Hibernation Mode: (?<Hybernation>.*)\nMatch State: (?<Match_State>.*)\nSession State: (?<Session_State>.*)\n(?<Players_Human>\d*) Human Players, (?<Players_Bots>\d*) Bots, (?<Players_Spectator>\d*) Spectators/,
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<ServerStatus> = {} as ServerStatus;
    response.Server_Name = args.groups?.Server_Name;
    response.Local_Address = args.groups?.Local_Address;
    response.Map = args.groups?.Map;
    response.Game_Mode = args.groups?.Game_Mode;
    response.Game_Mode_Class = args.groups?.Game_Mode_Class;
    response.Hybernation = args.groups?.Hybernation == 'Yes';
    response.Match_State = args.groups?.Match_State;
    response.Session_State = args.groups?.Session_State;
    response.Players_Human = parseInt(args.groups?.Players_Human as string);
    response.Players_Bots = parseInt(args.groups?.Players_Bots as string);
    response.Players_Total = response.Players_Bots + response.Players_Human;
    response.Players_Spectator = parseInt(
      args.groups?.Players_Spectator as string,
    );
    return response;
  },
  multiProperty: 'status',
};
export default StatusRule;
