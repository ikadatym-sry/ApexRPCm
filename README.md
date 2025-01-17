# ApexRPC

Lobby            |  In-Match
:-------------------------:|:-------------------------:
![](https://user-images.githubusercontent.com/32639831/143062717-b1a8debc-d661-4baa-99d7-320571dd7fef.png)  |  ![](https://user-images.githubusercontent.com/32639831/143062754-fe1106da-a5a0-4393-b336-5b77b74f87cc.png)

## Notes
- I am always sleepy, so it can be misspelled or something.
- Please gently tell me if I have some error(My heart is very fragile).
- If you are running the program and it not work properly, just try to close and open the program again.(at least it works for me)

## To Compile this project
- Download or clone or something so that you can get the project from here.
- Install [nexe](https://github.com/nexe/nexe)
- Run this code and you will get ApexRPC.exe
```
nexe main.js -r node_modules/@doctormckay/steam-crypto --target 12.18.2 -o ApexRPC.exe
```

## Overview

ApexRPC is a client to convert [Steam Rich Presence](https://partner.steamgames.com/doc/features/enhancedrichpresence) to [Discord Rich Presence](https://discord.com/rich-presence) for Apex Legends, written in Node.js.

## Usage

- Clone this repository or download the latest release from the [releases page](https://github.com/Holfz/ApexRPC/releases)
- Extract the zip file
- Copy the file named `.env.example`, then paste and rename it into `.env`
- Inside the `.env` file,
   - Replace `YOURSTEAMUSERNAME` with your Steam Username.
   - Replace `YOURSTEAMPASSWORD` with your Steam Password. 
- If you cloned this repo
   - Make sure [Node.js](https://nodejs.org/en/) is installed
   - Open your command-line interface
   - Do an `npm install`
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
| STEAM_USERNAME           |    ✔     | Your Steam Username                                                                                       |
| STEAM_PASSWORD           |    ✔     | Your Steam Password                                                                                       |
| LOG_LEVEL                |    ✕     | Minimum log level to produce. Values are `debug`, `info`, `silly`, `warn` and `error`. Default is `info`. |
| LAUNCH_APEX_IF_NESSESARY |    ✕     | If Steam is installed. Should ApexRPC launch Apex Legends for you?. Default is `false`.                   |

## Important Warning

Don't send your `.env` file to anyone.

We repeat...

DON'T send your `.env` file to anyone, even your parent.

One more time...

DON'T send your `.env` file to anyone, even your parent.

## Final Note

This project has been swinging around inside my PC since Apex Legends SS10 was released, and I was creating it for fun, only using it for a while. So I released it in case someone wanted this.

**Competitive, Arena, Ranked Arena is currently partially supported (I only play public: TRIO). Any PR, Contribution is appreciated.**

**EDIT (12 August 2022): Official Discord Presence is now supported by the game itself, But just hidden. This repo will goes to archive state if official one is shown. (I still happy to maintain this while official one is still hidden)**

[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)

## Legals
- All images, icons and trademarks belong to their respective owners.
- This project is not affiliated with EA/Respawn/EAC or any of its employees.
- Apex Legends is a registered trademark of EA. Game assets, materials and icons belong to Electronic Arts.
- EA and Respawn do not endorse the content of this project nor are responsible for this project.
