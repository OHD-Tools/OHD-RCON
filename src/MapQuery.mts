import Maps from './Maps.mjs';
import Factions from './Factions.mjs';

export type MapQueryProps = {
  Map: Maps
  game: string | null
  BluforFaction: string
  OpforFaction: string
  MinPlayers: number
  MaxPlayers: number
  bDisableKitRestrictions: boolean
  bBotAutofill: boolean
  BluforNumBots: number
  OpforNumBots: number
  BluforNumTickets: number
  OpforNumTickets: number
}

/**
 * Builder for OHD Map Strings
 */
export default class MapQuery {
  /**What map to set the server to */
  public Map: MapQueryProps['Map']
  /**Exclusive to Modded Gamemodes */
  public game: MapQueryProps['game']
  /**Blue Team Faction */
  public BluforFaction: MapQueryProps['BluforFaction']
  /**Red Team Faction*/
  public OpforFaction: MapQueryProps['OpforFaction']
  /**Minimum number of players to start a game. If bBotAutofill is enables, bots will spawn to this point */
  public MinPlayers: MapQueryProps['MinPlayers']
  /**Max number of players */
  public MaxPlayers: MapQueryProps['MaxPlayers']
  /**Allow All players to choose all kits, without limitation */
  public bDisableKitRestrictions: MapQueryProps['bDisableKitRestrictions']
  /**Auto fill the server with bots up to MinPlayers */
  public bBotAutofill: MapQueryProps['bBotAutofill']
  /**How many bots should the Blue Team have */
  public BluforNumBots: MapQueryProps['BluforNumBots']
  /**How many bots should the Red Team have */
  public OpforNumBots: MapQueryProps['OpforNumBots']
  /**How many Reinforcements should the Blue Team have */
  public BluforNumTickets: MapQueryProps['BluforNumTickets']
  /**How many Reinforcements should the Red Team have */
  public OpforNumTickets: MapQueryProps['OpforNumTickets']

  constructor($b: Partial<MapQueryProps> = {}) {
    if (typeof $b === 'string') {
      //TODO: Parser
    }
    this.Map = $b.Map ?? Maps.Argonne;
    this.game = $b.game ?? null;
    this.BluforFaction = $b.BluforFaction ?? Factions.DEFAULT;
    this.OpforFaction = $b.OpforFaction ?? Factions.DEFAULT;
    this.MinPlayers = $b.MinPlayers ?? 1;
    this.MaxPlayers = $b.MaxPlayers ?? 64;
    this.bDisableKitRestrictions = $b.bDisableKitRestrictions ?? false;
    this.bBotAutofill = $b.bBotAutofill ?? false;
    this.BluforNumBots = $b.BluforNumBots ?? 0;
    this.OpforNumBots = $b.OpforNumBots ?? 0;
    this.BluforNumTickets = $b.BluforNumTickets ?? 500;
    this.OpforNumTickets = $b.OpforNumTickets ?? 500;
  }
  /**
   * Generate the Level String
   */
  toString(): string {
    let map = '';
    map += this.Map;
    if (this.game != null) map += `?game=${this.game}`
    if (this.BluforFaction != null) map += `?BluforFaction=${this.BluforFaction}`
    if (this.OpforFaction != null) map += `?OpforFaction=${this.OpforFaction}`
    if (this.MinPlayers != null) map += `?MinPLayers=${this.MinPlayers}`
    if (this.MaxPlayers != null) map += `?MaxPlayers=${this.MaxPlayers}`
    if (this.bDisableKitRestrictions == true) map += `?bDisableKitRestrictions`
    if (this.bBotAutofill == true) map += `?bBotAutofill`
    if (this.BluforNumBots != null) map += `?BluforNumBots=${this.BluforNumBots}`
    if (this.OpforNumBots != null) map += `?OpforNumBots=${this.OpforNumBots}`
    if (this.BluforNumTickets != null) map += `?BluforNumTickets=${this.BluforNumTickets}`
    if (this.OpforNumTickets != null) map += `?OpforNumTickets=${this.OpforNumTickets}`
    return map
  }
}
