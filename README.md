# Operation: Harsh Doorstop RCON Interface

![npm](https://img.shields.io/npm/dw/@afocommunity/ohd-rcon) ![GitHub Sponsors](https://img.shields.io/github/sponsors/bombitmanbomb) [![GitHub issues](https://img.shields.io/github/issues/afocommunity/ohd-rcon)](https://github.com/afocommunity/OHD-RCON/issues) ![GitHub](https://img.shields.io/badge/license-MIT-brightgreen) ![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@afocommunity/ohd-rcon) [![Codacy grade](https://img.shields.io/codacy/grade/bc777618c71e42fb87caae1c0c970327?logo=codacy)](https://www.codacy.com/gh/afocommunity/OHD-RCON/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=afocommunity/OHD-RCON&amp;utm_campaign=Badge_Grade) ![GitHub](https://img.shields.io/badge/node->=16.0.0-brightgreen) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/afocommunity/ohd-rcon)

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

Documentation can be found [HERE](https://afocommunity.github.io/OHD-RCON/modules.html) 

![Docs](https://img.shields.io/website?down_color=red&down_message=offline&up_color=brightgreen&up_message=online&url=https%3A%2F%2Fafocommunity.github.io%2FOHD-RCON%2Fmodules.html)

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
