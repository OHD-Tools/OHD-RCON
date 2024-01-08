import { exec } from 'child_process';
import path from 'path';

export const SpawnServer = () => {
  const executable = path.join(path.resolve('ServerFiles/HarshDoorstop/Binaries/Win64/'), 'HarshDoorstopServer-Win64-Shipping.exe')
  const password = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16))

  let hasStarted = false
  let resolve = ({ password }) => {
    return password
  };
  console.log('Spawning...', executable)

  const server = exec(`${executable} AAS-TestMap?MaxPlayers=500 -log -EnableRCON -RconPassword="${password}" -SteamServerName="OHD-Rcon Automated Test Server"`);
  server.stdout?.setEncoding('utf8');
  server.stdout?.on('data', function (data) {
    //Here is where the output goes

    if (!hasStarted) {
      if (data?.trim() === 'LogGameMode: Display: Match State Changed from EnteringMap to WaitingToStart') {
        hasStarted = true
        resolve({ password });
      }
    }
  });

  return new Promise((r) => {
    resolve = r
  })
}
