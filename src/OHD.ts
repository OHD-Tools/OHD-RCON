import events from 'events';
import net from 'net';
import { ServerStatus } from './definitions/ServerStatus';
import { MapQuery, MapQueryProps, Readers } from '@ohd-tools/utils';
import { RCONParser, LogParser } from './parser';
import { PlayerKicked } from './definitions/PlayerKicked';
import { PlayerBanned } from './definitions/PlayerBanned';
import { Teams } from './definitions/Teams';
import { setupVariableProxy } from './utils/Variables';
import {
  ServerVariables,
  UnsafeVariables,
} from './definitions/ServerVariables';
import { Player } from './Player';
import { CommandSuccess } from './definitions/CommandSuccess';
import { PlayerChat } from './definitions/PlayerChat';
import { Message } from './Message';

enum PacketType {
  COMMAND = 0x02,
  AUTH = 0x03,
  RESPONSE_VALUE = 0x00,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  RESPONSE_AUTH = 0x02,
}

type RconResponse = {
  size: number;
  id: number;
  type: number;
  body: string;
};

/**!
 * node-rcon
 * Copyright(c) 2012 Justin Li <j-li.net>
 * MIT Licensed
 * Stripped Down and modified by @bombitmanbomb
 */
class Rcon extends events.EventEmitter {
  public host: string;
  public port: number;
  public password: string;
  public outstandingData: Buffer | null = null;
  public hasAuthed: boolean;
  public autoReconnect = true;
  protected _tcpSocket!: net.Socket;
  constructor(host: string, port: number, password: string) {
    super();
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
    try {
      this._tcpSocket = net.createConnection(this.port, this.host);
      this._tcpSocket.on('data', (data: Buffer): void => {
        this._tcpSocketOnData(data);
      });
      this._tcpSocket.on('connect', (): void => {
        this.socketOnConnect();
      });
      this._tcpSocket.on('error', (err: Error): void => {
        this.emit('error', err);
      });
      this._tcpSocket.on('end', (): void => {
        this.socketOnEnd();
      });
    } catch (error) {
      this.emit('error', error);
    }
  }
  send(data: string, cmd: number, id = 0x0012d4a6) {
    if (this.autoReconnect && !this.hasAuthed && cmd != PacketType.AUTH) {
      // Needs a proper solution.
      this.connect();
      this.send(this.password, PacketType.AUTH);
      return;
    }
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
    this._tcpSocket.setTimeout(timeout, (): void => {
      this._tcpSocket.end();
      if (callback) callback();
    });
  }
  _tcpSocketOnData(data: Buffer): boolean | void {
    if (this.outstandingData != null) {
      data = Buffer.concat(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [this.outstandingData as any, data as any],
        this.outstandingData.length + data.length,
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
      if (id == -1)
        return this.emit('error', new Error('Authentication failed'));

      if (!this.hasAuthed && type == PacketType.RESPONSE_AUTH) {
        this.hasAuthed = true;
        this.emit('auth');
      } else if (type == PacketType.RESPONSE_VALUE) {
        // Read just the body of the packet (truncate the last null byte)
        // See https://developer.valvesoftware.com/wiki/Source_RCON_Protocol for details
        let str: string = data.toString('utf8', 12, 12 + bodyLen);

        if (str.endsWith('\n')) {
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
  reject: (reason: unknown) => void;
  timeOut: NodeJS.Timeout;
};

type ParsingOptions =
  | {
      type: 'tail';
      options: Readers.TailLogReader['options'];
    }
  | {
      type: 'ftp';
      options: Readers.FTPLogReader['options'];
    }
  | {
      type: 'sftp';
      options: Readers.SFTPLogReader['options'];
    };

type OHDOptions = {
  disableAutoStatus?: boolean;
  autoReconnect?: boolean;
  logParsing?: ParsingOptions;
};

/**
 * Primary Interface Object for OHD servers.
 */
export class OHD {
  /**
   * Rejects if an error occurs when connecting.
   */
  public onReady!: Promise<null>;
  public rconParser!: RCONParser;
  public logParser!: LogParser;
  /**
   * Online Players
   */
  public players: Map<number, Player> = new Map();
  /**
   * Players who have recently Left
   */
  public recentPlayers: Array<Player> = [];
  public recentPlayerLimit: number = 10;
  public serverStatus: Omit<ServerStatus, 'Players'> = {} as Omit<
    ServerStatus,
    'Players'
  >;
  protected messageID!: number;
  protected _conn!: Rcon;
  protected _log!:
    | Readers.FTPLogReader
    | Readers.SFTPLogReader
    | Readers.TailLogReader;
  protected _isAuthorized!: boolean;
  protected _responsePromiseQueue!: Map<number, ResponsePromiseQueueObject>;
  public debug = false;
  /**Reconnect to the client */
  public reconnect!: () => Promise<unknown>;
  public _events!: events.EventEmitter;
  constructor(
    ip: string,
    port: number,
    password: string,
    options?: OHDOptions,
  ) {
    Object.defineProperty(this, '_isAuthorized', {
      enumerable: false,
      value: false,
    });
    Object.defineProperty(this, 'messageID', { enumerable: false, value: 1 });
    Object.defineProperty(this, '_events', {
      enumerable: false,
      value: new events.EventEmitter(),
    });
    Object.defineProperty(this, '_responsePromiseQueue', {
      enumerable: false,
      value: new Map(),
    });
    Object.defineProperty(this, '_updateServerStatus', {
      enumerable: false,
      value: this._updateServerStatus.bind(this),
    });
    Object.defineProperty(this, 'rconParser', {
      enumerable: false,
      value: new RCONParser(this),
    });
    Object.defineProperty(this, 'logParser', {
      enumerable: false,
      value: new LogParser(this),
    });
    Object.defineProperty(this, '_onResponse', {
      enumerable: false,
      value: this._onResponse.bind(this),
    });
    Object.defineProperty(this, '_updatePlayers', {
      enumerable: false,
      value: this._updatePlayers.bind(this),
    });
    Object.defineProperty(this, '_onError', {
      enumerable: false,
      value: this._onError.bind(this),
    });
    Object.defineProperty(this, '_onEnd', {
      enumerable: false,
      value: this.onEnd.bind(this),
    });
    Object.defineProperty(this, '_conn', {
      enumerable: false,
      value: new Rcon(ip, port, password),
    });
    const executor = (
      res: (val: null) => void,
      rej: (val: unknown) => void,
    ) => {
      let handled = false;
      this._conn.once('error', (err) => {
        if (handled) return;
        handled = true;
        rej(err);
      });
      this._conn.once('auth', (): void => {
        if (handled) return;
        handled = true;
        res(null);
      });
      this._conn.connect();
    };
    this._conn.autoReconnect =
      options?.autoReconnect ?? this._conn.autoReconnect ?? true;
    this._conn
      .on('response', this._onResponse)
      .on('error', this._onError)
      .on('end', this.onEnd);

    Object.defineProperty(this, 'onReady', {
      enumerable: false,
      value: new Promise<null>(executor),
    });
    Object.defineProperty(this, 'reconnect', {
      enumerable: false,
      value: () => {
        Object.defineProperty(this, 'onReady', {
          enumerable: false,
          value: new Promise<null>(executor),
        });
        return this.onReady;
      },
    });
    this.onReady
      .then(() => {
        this._events.emit('READY');
      })
      .catch((err) => {
        this._events.emit('error', err);
      });
    if (!options?.disableAutoStatus) {
      const getStatus = () => {
        this.status().then((status) => {
          if (status.Players != null)
            this._updatePlayers(
              new Map(status.Players.map((player) => [player.id, player])),
            );
          this._updateServerStatus(status);
        });
      };
      this.onReady
        .then(async () => {
          getStatus();
          setInterval(getStatus, 8000);
          //! Log Handler
          if (options?.logParsing != null) {
            const handleLogLine = (line: string) => {
              const logParsed = this.logParser.parse(line);
              if (logParsed == null) return;
              if (
                (logParsed as { type: 'chat'; data: PlayerChat }).type ===
                'chat'
              ) {
                const message = new Message(
                  this,
                  (logParsed as { type: 'chat'; data: PlayerChat }).data,
                );
                this._events.emit('CHAT', message);
              }
            };
            switch (options.logParsing.type) {
              case 'tail':
                this._log = new Readers.TailLogReader(
                  handleLogLine.bind(this),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  options.logParsing.options as any,
                );
                await this._log.setup();
                await this._log.watch();
                break;
              case 'ftp':
                this._log = new Readers.FTPLogReader(
                  handleLogLine.bind(this),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  options.logParsing.options as any,
                );
                await this._log.setup();
                await this._log.watch();
                break;
              case 'sftp':
                this._log = new Readers.SFTPLogReader(
                  handleLogLine.bind(this),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  options.logParsing.options as any,
                );
                await this._log.setup();
                await this._log.watch();
                break;
            }
          }
        })
        .catch(() => {
          //OOPS
        });
    }
    this._events.on('error', () => {
      //Handle Error. Hookable
    });
  }
  /**
   * The bot is ready
   */
  public on(event: 'READY', cb: () => void): events.EventEmitter;
  /**
   * Chat messages sent in the server
   */
  public on(event: 'CHAT', cb: (message: Message) => void): events.EventEmitter;
  /**
   * The player joined the server
   */
  public on(
    event: 'PLAYER_JOINED',
    cb: (player: Player) => void,
  ): events.EventEmitter;
  /**
   * The player left the server
   */
  public on(
    event: 'PLAYER_LEFT',
    cb: (player: Player) => void,
  ): events.EventEmitter;
  /**
   * The player was deleted from memory
   */
  public on(
    event: 'PLAYER_DELETED',
    cb: (player: Player) => void,
  ): events.EventEmitter;
  /**
   * The player was kicked
   */
  public on(
    event: 'PLAYER_KICKED',
    cb: (player: Player, event: PlayerKicked) => void,
  ): events.EventEmitter;
  /**
   * The player was banned
   */
  public on(
    event: 'PLAYER_BANNED',
    cb: (player: Player, event: PlayerBanned) => void,
  ): events.EventEmitter;
  public on(
    event: Parameters<events.EventEmitter['on']>[0],
    cb: Parameters<events.EventEmitter['on']>[1],
  ): events.EventEmitter {
    return this._events.on(event, cb);
  }

  public removeListener(
    event: Parameters<events.EventEmitter['removeListener']>[0],
    cb: Parameters<events.EventEmitter['removeListener']>[1],
  ): events.EventEmitter {
    return this._events.removeListener(event, cb);
  }
  protected _updateServerStatus(status: ServerStatus) {
    for (const prop in status) {
      if (prop == 'Players') continue;
      Reflect.set(this.serverStatus, prop, Reflect.get(status, prop));
    }
  }
  protected _updatePlayers(players: Map<number, Player>) {
    for (const [id] of this.players) {
      if (!players.has(id)) {
        const oldPlayer = this.players.get(id) as Player;
        this._events.emit('PLAYER_LEFT', oldPlayer);
        oldPlayer._events.emit('PLAYER_LEFT');
        this.recentPlayers.push(oldPlayer);
        this.players.delete(id);
        while (this.recentPlayers.length > this.recentPlayerLimit) {
          const p = this.recentPlayers.shift() as Player;
          this._events.emit('PLAYER_DELETED', p);
          p._events.emit('PLAYER_DELETED');
        }
      }
    }
    for (const [id, player] of players) {
      if (!this.players.has(id)) {
        this._events.emit('PLAYER_JOINED', player);
        this.players.set(id, player);
      }
    }
  }

  /**
   * Get the Server Status.
   */
  public status(): Promise<ServerStatus> {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.send('status').then((status: any) => {
      return {
        ...status.status,
        Players: status.players,
      };
    });
  }
  /**
   * Give the user Admin Access
   */
  public addAdmin(name: string | number) {
    if (typeof name === 'number') return this.addAdminById(name);
    return this.send<CommandSuccess>(`admin add "${name}"`);
  }
  /**
   * Give the user Admin Access
   */
  public addAdminById(id: number) {
    return this.send<CommandSuccess>(`admin addId ${id}`);
  }
  /**
   * Revoke the users Admin Access
   */
  public removeAdmin(name: string | number) {
    if (typeof name === 'number') return this.removeAdminById(name);
    return this.send<CommandSuccess>(`admin remove "${name}"`);
  }
  /**
   * Revoke the users Admin Access
   */
  public removeAdminById(id: number) {
    return this.send<CommandSuccess>(`admin removeId ${id}`);
  }
  /**
   * Add `amount` bots to the server.
   */
  public addBots(amount = 1): Promise<void> {
    return this.send(`addBots ${amount}`);
  }
  /**
   * Add a Named Bot to the server.
   */
  public addNamedBot(name = 'Chuck Norris'): Promise<void> {
    return this.send(`addNamedBot ${name}`);
  }
  /**
   * Add bots to a specified Team
   */
  public addTeamBots(team: 0 | 1 | Teams, amount: number): Promise<unknown> {
    return this.send(`addTeamBots ${team} ${amount}`);
  }
  /**
   * Add bots to the Opfor Team
   */
  public addOpforBots(amount: number): Promise<unknown> {
    return this.send(`addOpforBots ${amount}`);
  }
  /**
   * Add bots to the Blufor Team
   */
  public addBluforBots(amount: number): Promise<unknown> {
    return this.send(`addBluforBots ${amount}`);
  }
  /**
   * Remove bots from the specified Team
   */
  public removeTeamBots(team: 0 | 1 | Teams, amount: number): Promise<unknown> {
    return this.send(`removeTeamBots ${team} ${amount}`);
  }
  /**
   * Remove bots from the Opfor Team
   */
  public removeOpforBots(amount: number): Promise<unknown> {
    return this.send(`removeOpforBots ${amount}`);
  }
  /**
   * Remove bots from the Blufor Team
   */
  public removeBluforBots(amount: number): Promise<unknown> {
    return this.send(`removeBluforBots ${amount}`);
  }
  /**
   * Remove all bots from the server.
   */
  public removeAllBots(): Promise<void> {
    return this.send('removeAllBots') as Promise<void>;
  }
  /**
   * Kick a `Player` from the server by Username
   */
  public async kick(
    name: string | number,
    reason = 'You have been Kicked',
  ): Promise<PlayerKicked> {
    if (typeof name === 'number') return this.kickId(name, reason);
    const kicked = await this.send<PlayerKicked>(`kick "${name}" "${reason}"`);
    if (kicked.success) {
      const player = [...this.players.entries()].find((p) => p[1].name == name);
      if (player != undefined) {
        this._events.emit('PLAYER_KICKED', player[1], kicked);
        player[1]._events.emit('PLAYER_KICKED', kicked);
      }
    }
    return kicked;
  }
  /**
   * Kick a `Player` from the server by PlayerID
   */
  public async kickId(
    id: number,
    reason = 'You have been Kicked',
  ): Promise<PlayerKicked> {
    const kicked = await this.send<PlayerKicked>(`kickId ${id} "${reason}"`);
    if (kicked.success) {
      const player = this.players.get(id);
      if (player != undefined) {
        this._events.emit('PLAYER_KICKED', player, kicked);
        player._events.emit('PLAYER_KICKED', kicked);
      }
    }
    return kicked;
  }
  /**
   * Ban a `Player` from the server by Username.
   */
  public async ban(
    name: string | number,
    /** Duration in Seconds*/ duration = 0,
    reason?: string,
  ): Promise<PlayerBanned> {
    if (typeof name === 'number') return this.banId(name, duration, reason);
    if (reason == null)
      reason =
        duration == 0
          ? 'You have been Permanently Banned!'
          : `You have been Banned for ${duration} minutes!`;
    const banned = await this.send<PlayerBanned>(
      `ban "${name}" "${reason}" ${duration}`,
    );
    if (banned.success) {
      const player = [...this.players.entries()].find((p) => p[1].name == name);
      if (player != undefined) {
        this._events.emit('PLAYER_BANNED', player[1], banned);
        player[1]._events.emit('PLAYER_BANNED', banned);
      }
    }
    return banned;
  }
  /**
   * Ban a `Player` from the server by PlayerID.
   */
  public async banId(
    id: number,
    /** Duration in Seconds*/ duration = 0,
    reason?: string,
  ): Promise<PlayerBanned> {
    if (reason == null)
      reason =
        duration == 0
          ? 'You have been Permanently Banned!'
          : `You have been Banned for ${duration} minutes!`;
    const banned = await this.send<PlayerBanned>(
      `banId ${id} "${reason}" ${duration}`,
    );
    if (banned.success) {
      const player = this.players.get(id);
      if (player != undefined) {
        this._events.emit('PLAYER_BANNED', player, banned);
        player._events.emit('PLAYER_BANNED', banned);
      }
    }
    return banned;
  }
  /**
   * Create a new MapQuery Object to use with `serverTravel()`.
   */
  public createMapQuery(options?: MapQueryProps): MapQuery {
    return new MapQuery(options);
  }
  /**
   * Force the team of a `Player` by Username.
   *
   * 1: Blufor
   *
   * 0: Opfor
   */
  public forceTeam(name: string, teamId: 0 | 1 | Teams): Promise<unknown> {
    return this.send(`ForceTeam "${name}" ${teamId}`);
  }
  /**
   * Force the team of a `Player` by PlayerID.
   *
   * 1: Blufor
   *
   * 0: Opfor
   */
  public forceTeamId(id: number, teamId: 0 | 1 | Teams): Promise<unknown> {
    return this.send(`ForceTeamId ${id} ${teamId}`);
  }
  /**
   * Dot Access Setter for Server Variables.
   *
   * Do not ever set an accessor to a variable, always use .read() and .write()
   */
  get variables() {
    return setupVariableProxy<ServerVariables>(this);
  }
  /**
   * Dot Access Setter for Server Variables.
   *
   * Do not ever set an accessor to a variable, always use .read() and .write()
   */
  get variablesUnsafe() {
    return setupVariableProxy<UnsafeVariables>(this);
  }
  /**
   * Change the current Level.
   */
  public serverTravel(map: MapQuery | string): Promise<unknown> {
    let mapString: string;
    if (map instanceof MapQuery) {
      mapString = map.toString();
    } else {
      mapString = map as string;
    }
    return this.send(`serverTravel ${mapString}`);
  }
  /**
   * Send a message to all players.
   *
   * @note These messages only display from the in-game console currently.
   */
  public say(message: string): Promise<unknown> {
    return this.send(`say "${message}"`);
  }
  /**
   * Send a Raw RCON command.
   */
  public send<T>(cmd: string): Promise<T> {
    const id: number = this.messageID++;

    return new Promise((resolve, reject) => {
      const ob: ResponsePromiseQueueObject = {
        time: new Date(),
        buffer: '',
        handled: false,
      } as ResponsePromiseQueueObject;
      ob.resolve = (dat: unknown): void => {
        ob.handled = true;
        resolve(dat as T);
      };
      ob.reject = (dat: unknown): void => {
        ob.handled = true;
        reject(dat);
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
      const q: ResponsePromiseQueueObject = this._responsePromiseQueue.get(
        response.id,
      ) as ResponsePromiseQueueObject;
      if (size >= 4092) {
        //MAX PACKET SIZE, MIGHT BE SPLIT
        q.buffer += response.body;
        return;
      }
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any =
        this._parseResponse((q.buffer ?? '') + response.body) ?? response;
      if (res.success === false) {
        q.reject(res.data ?? res);
      } else {
        q.resolve(res.data ?? res);
      }
      this._responsePromiseQueue.delete(response.id);
      return;
    }
    // Non command
    //TODO
  }
  /**
   * Disconnect the client.
   */
  public disconnect(): void {
    this._conn.disconnect();
  }
  protected _parseResponse(res: string): unknown {
    const data: string = res?.replaceAll('\\n', '\n');
    if (data == null || data?.trim?.() == '') return null;
    return this.rconParser.parse(data);
  }
  protected _onError(err: string): void {
    if (this.debug) {
      console.error(err);
    }
    //Handle Error. Hookable
  }
  protected onEnd(): void {
    //TODO: onEnd
  }
}
