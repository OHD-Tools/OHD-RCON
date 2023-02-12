import type Player from '../Player'
export default interface ServerStatus {
  Server_Name: string
  Local_Address: string
  Map: string
  Game_Mode: string
  Game_Mode_Class: string
  Hybernation: boolean
  Match_State: string
  Session_State: string
  Players_Human: number
  Players_Bots: number
  Players_Total: number
  Players_Spectator: number
  Players: Player[]
}
