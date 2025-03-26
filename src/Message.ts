import { PlayerChat } from './definitions/PlayerChat';
import { OHD } from './OHD';
import { Player } from './Player';
export class Message {
  public created: PlayerChat['time'];
  public channel: PlayerChat['channel'];
  public steam64: PlayerChat['player_id'];
  public message: PlayerChat['message'];
  private _user!: Player;
  protected _controller!: OHD;

  constructor(
    controller: OHD | PlayerChat | null = null,
    $b: PlayerChat = {} as PlayerChat,
  ) {
    // Want to do instanceof, but circular dependency :(
    if (
      controller != null &&
      (controller as unknown as { _onResponse: () => void })._onResponse == null
    ) {
      $b = controller as PlayerChat;
      controller = null;
    }
    Object.defineProperty(this, '_controller', {
      value: controller,
      enumerable: false,
    });
    this.message = $b.message;
    this.steam64 = $b.player_id;
    this.channel = $b.channel;
    this.created = $b.time ?? new Date();
  }

  public get User() {
    if (!this.hasController) return null;
    if (this._user != null) return this._user;
    for (const player of this._controller.players.values()) {
      if (player.steam64 === this.steam64) {
        this._user = player;
        return player;
      }
    }
    return null;
  }

  protected get hasController(): boolean {
    return this._controller != undefined;
  }
}
