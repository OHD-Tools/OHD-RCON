# Operation: Harsh Doorstop RCON Interface

![npm](https://img.shields.io/npm/dw/@afocommunity/ohd-rcon) ![GitHub Sponsors](https://img.shields.io/github/sponsors/afocommunity) [![GitHub issues](https://img.shields.io/github/issues/afocommunity/ohd-rcon)](https://github.com/afocommunity/OHD-RCON/issues) ![GitHub](https://img.shields.io/github/license/afocommunity/ohd-rcon) ![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@afocommunity/ohd-rcon) ![node-current (scoped)](https://img.shields.io/node/v/@afocommunity/ohd-rcon) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/afocommunity/ohd-rcon)

![GitHub package.json version](https://img.shields.io/github/package-json/v/afocommunity/ohd-rcon) ![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/afocommunity/ohd-rcon)

# Documentation

Documentation can be found [HERE](https://afocommunity.github.io/OHD-RCON/modules.html)

# Usage

```ts
// Example Usage that bans all players with a given word or phrase in their name.
import { OHD } from '@afocommunity/ohd-rcon';

const myServer = new OHD('127.0.0.1', 8000, 'mypassword');

function scanPlayersForNaughtyWords() {
  myServer.status().then(status => {
    status.Players.filter(player=>player.name.includes('<insert bad word here>'))
      .forEach(player => {
        //Args: Length in seconds, Reason.
        player.ban(0, 'Bad Words in Name');
      });
  })
}

myServer.onReady.then(() => {
  setInterval(scanPlayersForNaughtyWords, 10000)
});

```
