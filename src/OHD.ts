import EventEmitter from 'events';
import { Socket } from 'net';
import events from 'events'
import net from 'net'
import ServerStatus from './definitions/ServerStatus';
import MapQuery, { MapQueryProps } from './MapQuery';
import Player from './Player';

enum PacketType {
  COMMAND = 0x02,
  AUTH = 0x03,
  RESPONSE_VALUE = 0x00,
  RESPONSE_AUTH = 0x02,
}

type RconResponse = {
  size: number;
  id: number;
  type: number;
  body: string;
}

/**!
 * node-rcon
 * Copyright(c) 2012 Justin Li <j-li.net>
 * MIT Licensed
 * Stripped Down and modified by @bombitmanbomb
 */
class Rcon extends EventEmitter {
  public host: string
  public port: number
  public password: string
  public outstandingData: Buffer | null = null
  public hasAuthed: boolean
  protected _tcpSocket!: Socket
  constructor(host: string, port: number, password: string) {
    super()
    this.host = host;
    this.port = port;
    this.password = password;
    this.hasAuthed = false;
    events.EventEmitter.call(this);
  }

  _sendSocket(buf: Buffer): void {
    this._tcpSocket.write(buf.toString('binary'), 'binary');
  }
  connect(): void {
    this._tcpSocket = net.createConnection(this.port, this.host);
    this._tcpSocket
      .on('data', ((data: Buffer): void => {
        this._tcpSocketOnData(data);
      }).bind(this))
      .on('connect', ((): void => {
        this.socketOnConnect();
      }).bind(this))
      .on('error', ((err: Error): void => {
        this.emit('error', err);
      }).bind(this))
      .on('end', ((): void => {
        this.socketOnEnd();
      }).bind(this));
  }
  send(data: string, cmd: number, id = 0x0012d4a6) {
    cmd = cmd || PacketType.COMMAND;
    const length: number = Buffer.byteLength(data);
    const sendBuf: Buffer = Buffer.alloc(length + 14);
    sendBuf.writeInt32LE(length + 10, 0);
    sendBuf.writeInt32LE(id, 4);
    sendBuf.writeInt32LE(cmd, 8);
    sendBuf.write(data, 12);
    sendBuf.writeInt16LE(0, length + 12);

    this._sendSocket(sendBuf);
  }
  disconnect(): void {
    if (this._tcpSocket) this._tcpSocket.end();
  }
  setTimeout(timeout: number, callback: () => unknown): void {
    if (!this._tcpSocket) return;
    this._tcpSocket.setTimeout(timeout, ((): void => {
      this._tcpSocket.end();
      if (callback) callback();
    }).bind(this));
  }
  _tcpSocketOnData(data: Buffer): boolean | void {
    if (this.outstandingData != null) {
      data = Buffer.concat(
        [this.outstandingData, data],
        this.outstandingData.length + data.length
      );
      this.outstandingData = null;
    }

    while (data.length >= 12) {
      const len: number = data.readInt32LE(0); // Size of entire packet, not including the 4 byte length field
      if (!len) return; // No valid packet header, discard entire buffer

      const packetLen: number = len + 4;
      if (data.length < packetLen) break; // Wait for full packet, TCP may have segmented it

      const bodyLen: number = len - 10; // Subtract size of ID, type, and two mandatory trailing null bytes
      if (bodyLen < 0) {
        data = data.subarray(packetLen); // Length is too short, discard malformed packet
        break;
      }
      const id: number = data.readInt32LE(4);
      const type: number = data.readInt32LE(8);
      if (id == -1) return this.emit('error', new Error('Authentication failed'));

      if (!this.hasAuthed && type == PacketType.RESPONSE_AUTH) {
        this.hasAuthed = true;
        this.emit('auth');
      } else if (type == PacketType.RESPONSE_VALUE) {
        // Read just the body of the packet (truncate the last null byte)
        // See https://developer.valvesoftware.com/wiki/Source_RCON_Protocol for details
        let str: string = data.toString('utf8', 12, 12 + bodyLen);

        if (str.charAt(str.length - 1) === '\n') {
          // Emit the response without the newline.
          str = str.substring(0, str.length - 1);
        }

        const response = {
          size: data.readInt32LE(0),
          id: data.readInt32LE(4),
          type: data.readInt32LE(8),
          body: str,
        };
        this.emit('response', response);
      }

      data = data.subarray(packetLen);
    }

    // Keep a reference to remaining data, since the buffer might be split within a packet
    this.outstandingData = data;
  }


  socketOnConnect(): void {
    this.emit('connect');
    this.send(this.password, PacketType.AUTH);
  }

  socketOnEnd(): void {
    this.emit('end');
    this.hasAuthed = false;
  }
}

type ResponsePromiseQueueObject = {
  time: Date;
  buffer: string;
  handled: boolean;
  resolve: (data: unknown) => void;
  timeOut: NodeJS.Timeout;
}


/**
 * Primary Interface Object for OHD servers.
 */
export default class OHD {
  private messageID = 1
  public onReady: Promise<null>
  protected _conn!: Rcon
  protected _isAuthorized!: boolean
  protected _responsePromiseQueue!: Map<number, ResponsePromiseQueueObject>
  constructor(ip: string, port: number, password: string) {
    Object.defineProperty(this, '_isAuthorized', { enumerable: false, value: false });
    Object.defineProperty(this, '_responsePromiseQueue', { enumerable: false, value: new Map });
    Object.defineProperty(this, '_onResponse', { enumerable: false, value: this._onResponse.bind(this) });
    Object.defineProperty(this, '_onError', { enumerable: false, value: this._onError.bind(this) });
    Object.defineProperty(this, '_onEnd', { enumerable: false, value: this.onEnd.bind(this) });
    Object.defineProperty(this, '_conn', { enumerable: false, value: new Rcon(ip, port, password) });
    this.onReady = new Promise((res) => {
      let handled = false;
      this._conn.on('auth', (): void => {
        if (handled) return;
        handled = true;
        res(null);
      });
    });
    this._conn
      .on('response', this._onResponse)
      .on('error', this._onError)
      .on('end', this.onEnd);

    this._conn.connect();
  }
  /**
   * Get the Server Status.
   */
  status(): Promise<ServerStatus> {
    return this.send('status') as Promise<ServerStatus>;
  }
  /**
   * Add `amount` bots to the server.
   */
  addBots(amount = 1): Promise<unknown> {
    return this.send(`addBots ${amount}`);
  }
  /**
   * Add a Named Bot to the server.
   */
  addNamedBot(name = 'Chuck Norris'): Promise<unknown> {
    return this.send(`addNamedBot ${name}`);
  }
  /**
   * Remove all bots from the server.
   */
  removeAllBots(): Promise<unknown> {
    return this.send('removeAllBots');
  }
  /**
   * Kick a `Player` from the server by Username
   */
  kick(name: string, reason = 'You have been Kicked'): Promise<unknown> {
    return this.send(`kick "${name}" "${reason}"`);
  }
  /**
   * Kick a `Player` from the server by PlayerID
   */
  kickId(id: number, reason = 'You have been Kicked'): Promise<unknown> {
    return this.send(`kickId ${id} "${reason}"`);
  }
  /**
   * Ban a `Player` from the server by Username.
   */
  ban(name: string, /** Duration in Seconds*/ duration = 0, reason?: string,): Promise<unknown> {
    if (reason == null) reason = duration == 0 ? 'You have been Permanently Banned!' : `You have been Banned for ${duration} minutes!`
    return this.send(`ban "${name}" "${reason}" ${duration}`);
  }
  /**
   * Ban a `Player` from the server by PlayerID.
   */
  banId(id: number, /** Duration in Seconds*/ duration = 0, reason?: string): Promise<unknown> {
    if (reason == null) reason = duration == 0 ? 'You have been Permanently Banned!' : `You have been Banned for ${duration} minutes!`
    return this.send(`banId ${id} "${reason}" ${duration}`);
  }
  /**
   * Create a new MapQuery Object to use with `serverTravel()`.
   */
  createMapQuery(options?: MapQueryProps): MapQuery {
    return new MapQuery(options);
  }
  /**
   * Force the team of a `Player` by Username.
   *
   * 1: Blufor
   *
   * 0: Opfor
   */
  forceTeam(name: string, teamId: 0|1): Promise<unknown> {
    return this.send(`ForceTeam "${name}" ${teamId}`);
  }
  /**
   * Force the team of a `Player` by PlayerID.
   *
   * 1: Blufor
   *
   * 0: Opfor
   */
  forceTeamId(id: number, teamId: 0|1): Promise<unknown> {
    return this.send(`ForceTeamId ${id} ${teamId}`);
  }
  /**
   * Change the current Level.
   */
  serverTravel(map: MapQuery | string): Promise<unknown> {
    let mapString: string;
    if (map instanceof MapQuery) {
      mapString = map.toString();
    } else {
      mapString = map as string;
    }
    return this.send(`serverTravel ${mapString}`);
  }
  /**
   * Send a Raw RCON command.
   */
  send(cmd: string): Promise<unknown> {
    const id: number = this.messageID++;

    return new Promise((resolve) => {
      const ob: ResponsePromiseQueueObject = {
        time: new Date(),
        buffer: '',
        handled: false,
      } as ResponsePromiseQueueObject;
      ob.resolve = (dat: unknown): void => {
        ob.handled = true;
        resolve(dat);
      };
      //? Timeout in the event of the final packet is Max packet length
      ob.timeOut = setTimeout((): void => {
        if (ob.handled) return;
        ob.handled = true;
        ob.resolve(this._parseResponse(ob.buffer) ?? ob.buffer);
      }, 5000);
      this._responsePromiseQueue.set(id, ob);
      this._conn.send(cmd, 0x02, id);
    });
  }
  protected _onResponse(response: RconResponse): void {
    const size: number = response?.size;
    if (this._responsePromiseQueue.has(response.id)) {
      const q: ResponsePromiseQueueObject = this._responsePromiseQueue.get(response.id) as ResponsePromiseQueueObject;
      if (size >= 4092) {
        //MAX PACKET SIZE, MIGHT BE SPLIT
        q.buffer += response.body;
        return;
      }
      const res: unknown =
        this._parseResponse((q.buffer ?? '') + response.body) ?? response;
      q.resolve(res);
      this._responsePromiseQueue.delete(response.id);
      return;
    }
    // Non command
    //TODO
  }
  protected _parseResponse(res: string): unknown {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = {};
    const data: string = res?.replaceAll('\\n', '\n');

    if (data == null || data?.trim?.() == '') return null;
    let handled = false;
    //TODO Seperate Out into Modules
    if (!handled) {
      /**Example messages for Kicking
       * "Player with name 'Spider' was successfully kicked from the server with reason 'This is a Test'"
       * "Player with id number '415' was successfully kicked from the server with reason 'This'"
       * "Failed to kick specified player by id number with reason 'This', no player with the id number '999' exists or the kick operation has failed!"
       * "Failed to kick specified player by name with reason 'This is a Test', no player with the name 'GenericPlayer' exists or the kick operation has failed!"
       */
    }
    if (!handled) {
      const matchStatusServerRegex =
        /Server Name: (?<Server_Name>.*)\nLocal Address: (?<Local_Address>.*)\nMap: (?<Map>.*)\nGame Mode: (?<Game_Mode>.*) \[(?<Game_Mode_Class>.*)\]\nIs In Hibernation Mode: (?<Hybernation>.*)\nMatch State: (?<Match_State>.*)\nSession State: (?<Session_State>.*)\n(?<Players_Human>\d*) Human Players, (?<Players_Bots>\d*) Bots, (?<Players_Spectator>\d*) Spectators/;
      const matchStatusPlayerListRegex =
        /(?<Player_ID>\d+)\t(?<Name>.+)\s+(?<Steam64>BOT|(?:765\d{14}))/gm;
      const statusServerInfo = data.match(matchStatusServerRegex);
      if (statusServerInfo != null) {
        handled = true;
        response.Server_Name = statusServerInfo.groups?.Server_Name;
        response.Local_Address = statusServerInfo.groups?.Local_Address;
        response.Map = statusServerInfo.groups?.Map;
        response.Game_Mode = statusServerInfo.groups?.Game_Mode;
        response.Game_Mode_Class = statusServerInfo.groups?.Game_Mode_Class;
        response.Hybernation = statusServerInfo.groups?.Hybernation == 'Yes';
        response.Match_State = statusServerInfo.groups?.Match_State;
        response.Session_State = statusServerInfo.groups?.Session_State;
        response.Players_Human = parseInt(
          statusServerInfo.groups?.Players_Human as string
        );
        response.Players_Bots = parseInt(statusServerInfo.groups?.Players_Bots as string);
        response.Players_Spectator = parseInt(
          statusServerInfo.groups?.Players_Spectator as string
        );
        const statusPlayerList = data.matchAll(matchStatusPlayerListRegex);

        response.Players = [];
        if (statusPlayerList) {
          for (const match of statusPlayerList) {
            response.Players.push(
              new Player(this, {
                id: parseInt(match.groups?.Player_ID as string),
                name: match.groups?.Name?.trim() as string,
                steam64:
                  match.groups?.Steam64 != 'BOT' ? match.groups?.Steam64 as string : null,
              })
            );
          }
        }
      }
    }

    if (!handled) return null;
    return response;
  }
  protected _onError(str: string): void {
    console.error(str);
  }
  protected onEnd(): void {
    //TODO: onEnd
  }
}
// /(?<Player_ID>\d+)     (?<Name>.+)(?<Steam64>BOT|(?:765\d{14}))/gm
// /Server Name: (?<Server_Name>.*)\nLocal Address: (?<Local_Address>.*)\nMap: (?<Map>.*)\nGame Mode: (?<Game_Mode>.*)\[(?<Game_Mode_Class>.*)\]\nIs In Hibernation Mode: (?<Hybernation>.*)\nMatch State: (?<Match_State>.*)\nSession State: (?<Session_State>.*)\n(?<Players_Human>\d*) Human Players, (?<Players_Bots>\d*) Bots, (?<Players_Spectator>\d*) Spectators/
