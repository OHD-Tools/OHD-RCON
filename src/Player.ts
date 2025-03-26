import EventEmitter from 'events';
import type { OHD } from './OHD';
import type { Teams } from './definitions/Teams';
import { PlayerKicked } from './definitions/PlayerKicked';
import { PlayerBanned } from './definitions/PlayerBanned';
type PlayerProps = {
  id: number;
  steam64: string | null;
  name: string;
  created?: Date;
};
/**
 * Generic Player Object
 */
export class Player {
  public id: PlayerProps['id'];
  public steam64: PlayerProps['steam64'];
  public name: PlayerProps['name'];
  public created: Date;
  public _events!: EventEmitter;
  protected _controller!: OHD;

  constructor(
    controller: OHD | PlayerProps | null = null,
    $b: PlayerProps = {} as PlayerProps,
  ) {
    // Want to do instanceof, but circular dependency :(
    if (
      controller != null &&
      (controller as unknown as { _onResponse: () => void })._onResponse == null
    ) {
      $b = controller as PlayerProps;
      controller = null;
    }

    Object.defineProperty(this, '_controller', {
      value: controller,
      enumerable: false,
    });
    Object.defineProperty(this, '_events', {
      value: new EventEmitter(),
      enumerable: false,
    });

    this.id = $b.id;
    this.steam64 = $b.steam64;
    this.name = $b.name;
    this.created = $b.created ?? new Date();
  }
  /**
   * The player has Left the Server
   */
  public on(event: 'PLAYER_LEFT', cb: () => void): EventEmitter;
  /**
   * The player has been cleared out of memory
   */
  public on(event: 'PLAYER_DELETED', cb: () => void): EventEmitter;
  /**
   * The player has been Kicked
   */
  public on(
    event: 'PLAYER_KICKED',
    cb: (event: PlayerKicked) => void,
  ): EventEmitter;
  /**
   * The player has been Banned
   */
  public on(
    event: 'PLAYER_BANNED',
    cb: (event: PlayerBanned) => void,
  ): EventEmitter;
  public on(
    event: Parameters<EventEmitter['on']>[0],
    cb: Parameters<EventEmitter['on']>[1],
  ): EventEmitter {
    return this._events.on(event, cb);
  }

  public removeListener(
    event: Parameters<EventEmitter['removeListener']>[0],
    cb: Parameters<EventEmitter['removeListener']>[1],
  ): EventEmitter {
    return this._events.removeListener(event, cb);
  }

  /**Is the player a Bot */
  get isBot(): boolean {
    return this.steam64 == null;
  }

  protected get hasController(): boolean {
    return this._controller != undefined;
  }
  protected controllerReject(): Promise<{ success: false; reason: string }> {
    return Promise.reject({
      success: false,
      reason: `Object for Player ${this.id} does not have an RCON Controller.`,
    });
  }
  /**Kick the current `Player` */
  kick(reason = 'You have been Kicked!') {
    if (!this.hasController) return this.controllerReject();
    return this._controller.kickId(this.id, reason);
  }
  /**Ban the current `Player` */
  ban(duration = 0, reason?: string) {
    if (!this.hasController) return this.controllerReject();
    return this._controller.banId(this.id, duration, reason);
  }
  /**Set the team of the current `Player` */
  setTeam(teamId: 0 | 1 | Teams) {
    if (!this.hasController) return this.controllerReject();
    return this._controller.forceTeamId(this.id, teamId);
  }
  /**
   * Give the user Admin Access
   */
  addAdmin() {
    if (!this.hasController) return this.controllerReject();
    return this._controller.addAdminById(this.id);
  }
  /**
   * Revoke the users Admin Access
   */
  removeAdmin() {
    if (!this.hasController) return this.controllerReject();
    return this._controller.removeAdminById(this.id);
  }
}
