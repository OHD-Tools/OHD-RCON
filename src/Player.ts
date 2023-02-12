import type OHD from './OHD';
import type { Teams } from './Teams';
type PlayerProps = {
  id: number
  steam64: string | null
  name: string
}
/**
 * Generic Player Object
 */
export default class Player {
  public id: PlayerProps['id'];
  public steam64: PlayerProps['steam64'];
  public name: PlayerProps['name'];
  protected _controller!: OHD;

  constructor(controller: OHD | PlayerProps | null = null, $b: PlayerProps = {} as PlayerProps) {
    // Want to do instanceof, but circular dependency :(
    if (controller != null && ((controller as unknown as { _onResponse: (() => void) })._onResponse == null)) {
      $b = controller as PlayerProps;
      controller = null;
    }

    Object.defineProperty(this, '_controller', { value: controller, enumerable: false });

    this.id = $b.id;
    this.steam64 = $b.steam64;
    this.name = $b.name;
  }
  /**Is the player a Bot */
  get isBot(): boolean {
    return this.steam64 == null;
  }

  protected get hasController(): boolean {
    return this._controller != undefined;
  }
  protected controllerReject(): Promise<{ reason: string }> {
    return Promise.reject({ reason: `Object for Player ${this.id} does not have an RCON Controller.` });
  }
  /**Kick the current `Player` */
  kick(reason = "You have been Kicked!"): Promise<unknown> {
    if (!this.hasController) return this.controllerReject();
    return this._controller.kickId(this.id, reason);
  }
  /**Ban the current `Player` */
  ban(duration = 0, reason?: string,): Promise<unknown> {
    if (!this.hasController) return this.controllerReject();
    return this._controller.banId(this.id, duration, reason);
  }
  /**Set the team of the current `Player` */
  setTeam(teamId: 0 | 1 | Teams): Promise<unknown> {
    if (!this.hasController) return this.controllerReject();
    return this._controller.forceTeamId(this.id, teamId);
  }
}
