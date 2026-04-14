# ApexRPC

## Notes
- This project is originally created by [Holfz](https://github.com/Holfz/ApexRPC), and I just forked it for my own use, educational, fun, hobby, and smth like that.
- I am always sleepy, so it can be misspelled or something.
- Please gently tell me if I have some error(My heart is very fragile).
- If you are running the program and it not work properly, just try to close and open the program again.(at least it works for me)

Lobby            |  In-Match
:-------------------------:|:-------------------------:
![](https://user-images.githubusercontent.com/32639831/143062717-b1a8debc-d661-4baa-99d7-320571dd7fef.png)  |  ![](https://user-images.githubusercontent.com/32639831/143062754-fe1106da-a5a0-4393-b336-5b77b74f87cc.png)

## To Compile this project
# (0)
OK, if you lazy to compile by yourself, you can just download the latest release from [here](https://github.com/ikadatym-sry/ApexRPCm/releases/latest)
# (1)
```
git clone https://github.com/ikadatym-sry/ApexRPCm.git
cd ApexRPCm 
npm i 
npm run build 
ApexRPC.exe
```
# (2)
- Download or clone or something so that you can get the project from here.
- Install [nexe](https://github.com/nexe/nexe)
- Run this code and you will get ApexRPC.exe
```
nexe -i main.js -r node_modules/@doctormckay/steam-crypto --target windows-x64-14.15.3 -o ApexRPC.exe
```
If the built executable opens a Node.js prompt like `Welcome to Node.js ...` instead of starting ApexRPC, your build likely did not embed the app entry file. Rebuild using the command above (or run `npm run build`) and replace the old ApexRPC.exe.
## Overview
ApexRPC is a Discord Rich Presence client for Apex Legends, written in Node.js.
- `GAME_PLATFORM=steam` (default): full mode using [Steam Rich Presence](https://partner.steamgames.com/doc/features/enhancedrichpresence) mapped to [Discord Rich Presence](https://discord.com/rich-presence).
- `GAME_PLATFORM=ea`: experimental fallback mode using local Apex process detection (limited details).
## Usage
- First warning: Don't send your `.env` file to anyone.
- Copy the file named `.env.example`, then paste and rename it into `.env`
- Inside the `.env` file,
   - Set `GAME_PLATFORM=steam` for full rich presence details (map/mode/party from Steam payload).
   - (NOt tested yet) Set `GAME_PLATFORM=ea` for experimental process-based mode (no Steam login required).
   - If using Steam mode, replace `YOURSTEAMUSERNAME` and `YOURSTEAMPASSWORD` with your Steam account credentials.
- If you cloned this repo
   - Make sure [Node.js](https://nodejs.org/en/) is installed
   - Open your command-line interface
   - Do an `npm ci`
   - Run `node main.js`
- If you've downloaded the released executables
   - Run `ApexRPC.exe`
- App will ask for your Steam Guard code if you have one
- Start playing Apex Legends

### Still have no idea what I'm talking about? Here's a video:

https://user-images.githubusercontent.com/32639831/143059780-29ca2bad-4a13-4b61-9483-290c756a791e.mov

### Environment variables (.env)
| Parameter                | Required | Description                                                                                               |
|--------------------------|:--------:|-----------------------------------------------------------------------------------------------------------|
| GAME_PLATFORM            |    ✕     | `steam` (default, full mode) or `ea` (experimental mode).                                                 |
| STEAM_USERNAME           |    ✔*    | Your Steam Username. Required when `GAME_PLATFORM=steam`.                                                  |
| STEAM_PASSWORD           |    ✔*    | Your Steam Password. Required when `GAME_PLATFORM=steam`.                                                  |
| LOG_LEVEL                |    ✕     | Minimum log level to produce. Values are `debug`, `info`, `silly`, `warn` and `error`. Default is `info`. |
| DISCORD_CLIENT_ID        |    ✕     | Custom Discord application id. If empty, ApexRPC default id is used.                                     |
| ALWAYS_OVERRIDE_DISCORD_ACTIVITY | ✕ | If `true`, ApexRPC keeps overriding Discord activity while the app is running, even when Apex is not detected. Default is `false`. |
| ALWAYS_OVERRIDE_DETAILS  |    ✕     | `details` text used when always-override mode is active and Apex is not detected.                         |
| ALWAYS_OVERRIDE_STATE    |    ✕     | `state` text used when always-override mode is active and Apex is not detected.                           |
| LAUNCH_APEX_IF_NECESSARY |    ✕     | If Steam is installed, should ApexRPC launch Apex Legends for you? Default is `false`. Legacy alias: `LAUNCH_APEX_IF_NESSESARY`. |
| SHOW_SERVER              |    ✕     | Show server/region in Discord state line. Default is `false`. Legacy alias: `Show_Server`.               |
| AUTO_DETECT_SERVER       |    ✕     | Try to detect server/region from Steam rich presence payload. Default is `true`.                          |
| PLAYING_ON_SERVER        |    ✕     | Fallback server label if auto-detection is not available (example: `Singapore`).                          |
| EA_PROCESS_POLL_INTERVAL_MS | ✕     | Poll interval for Apex process checks in EA mode. Default is `15000`.                                     |
| EA_ACTIVITY_DETAILS      |    ✕     | Discord `details` text used in EA mode.                                                                    |
| EA_ACTIVITY_STATE        |    ✕     | Discord `state` text used in EA mode.                                                                      |
| LOG_RICH_PRESENCE_KEYS   |    ✕     | Log full Steam rich presence payload whenever it changes (debug/troubleshooting). Default is `false`.     |

Notes:
- Steam mode has the highest fidelity (map/mode/match state). EA mode is currently generic due limited public data access.

## Important Warning

Don't send your `.env` file to anyone.

We repeat...

DON'T send your `.env` file to anyone, even your parent.

One more time...

DON'T send your `.env` file to anyone, even your parent.

## Final Note

- Lately I'm out from Apex Legends game (I don't even know what season it is as I'm writing this) and I will only update it when I want to do

[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)

## Legals
- All images, icons and trademarks belong to their respective owners.
- This project is not affiliated with EA/Respawn/EAC or any of its employees.
- Apex Legends is a registered trademark of EA. Game assets, materials and icons belong to Electronic Arts.
- EA and Respawn do not endorse the content of this project nor are responsible for this project.
