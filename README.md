<p align="center">
  <img src="https://github.com/afocommunity/OHD-RCON/raw/main/.github/assets/logo.png" />
</p>

# Operation: Harsh Doorstop RCON Interface

![npm](https://img.shields.io/npm/dw/@afocommunity/ohd-rcon) ![GitHub Sponsors](https://img.shields.io/github/sponsors/bombitmanbomb) [![GitHub issues](https://img.shields.io/github/issues/afocommunity/ohd-rcon)](https://github.com/afocommunity/OHD-RCON/issues) ![GitHub](https://img.shields.io/badge/license-MIT-brightgreen) ![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@afocommunity/ohd-rcon) [![Codacy grade](https://img.shields.io/codacy/grade/bc777618c71e42fb87caae1c0c970327?logo=codacy)](https://www.codacy.com/gh/afocommunity/OHD-RCON/dashboard?utm_source=github.com&utm_medium=referral&utm_content=afocommunity/OHD-RCON&utm_campaign=Badge_Grade) ![GitHub](https://img.shields.io/badge/node->=16.0.0-brightgreen) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/afocommunity/ohd-rcon)

![GitHub package.json version](https://img.shields.io/github/package-json/v/afocommunity/ohd-rcon) ![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/afocommunity/ohd-rcon)

# Installation

NPM

```bash
npm install @afocommunity/ohd-rcon
```

YARN

```bash
yarn add @afocommunity/ohd-rcon
```

# Documentation

Documentation can be found [HERE](https://ohd-tools.github.io/OHD-RCON/)

![Docs](https://img.shields.io/website?down_color=red&down_message=offline&up_color=brightgreen&up_message=online&url=https%3A%2F%2Fafocommunity.github.io%2FOHD-RCON%2Fmodules.html)

# Usage

```ts
// Example Usage that bans all players with a given word or phrase in their name.
import { OHD } from '@afocommunity/ohd-rcon';

const myServer = new OHD('127.0.0.1', 8000, 'mypassword');

myServer.on('PLAYER_JOINED', (player) => {
  if (!player.isBot && player.name.includes('Naughty Word')) {
    player.ban(0, 'Bad Words in Name');
  }
});

myServer.on('READY', () => {
  myServer.variables.HD.Game.DisableKitRestrictionsOverride.write('1');
  myServer.variables.HD.Game.MinRespawnDelayOverride.write('0.00');
});
// Alternatively
myServer.onReady.then(() => {
  let restrictions =
    myServer.variables.HD.Game.DisableKitRestrictionsOverride.read();

  let respawnDelayInfo =
    myServer.variables.HD.Game.MinRespawnDelayOverride.readDetailed();
});
```

# Development

To run tests locally, place a copy of [steamcmd.exe](https://developer.valvesoftware.com/wiki/SteamCMD#Windows) in the `steamcmd` folder.
This is used to download OHD and boot a local server for testing purposes. You **MUST** port forward `7777, 7778, 7779, 27005` (Default)
