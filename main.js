/* env */
require('dotenv').config();

/* Dependencies */
const DiscordRPC = require('discord-rpc');
const SteamUser = require('steam-user');
const prompts = require('prompts');
const find = require('find-process');
const exec = require('child_process').exec;
const Registry = require('winreg');

/* Helpers */
const logger = require('./Helpers/Logger');

/* Constants */
const Translation = require('./Constants/Translation');
const Gallery = require('./Constants/Gallery');
const Termination = require('./Constants/Termination');

/* Variable */
const SteamClient = new SteamUser();
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
const appVersion = require('./package.json').version;
let [discordReady, startTimestamp, playState] = [false, null, 0];
let [lastRichPresenceDumpSignature, lastDetectedServer] = [null, null];

const TRUE_VALUES = ['yes', 'y', 'true', '1', 'on'];
const launchApexIfNecessary = isTruthy(process.env.LAUNCH_APEX_IF_NECESSARY || process.env.LAUNCH_APEX_IF_NESSESARY);
const showServer = isTruthy(process.env.SHOW_SERVER || process.env.Show_Server);
const autoDetectServer = isTruthy(process.env.AUTO_DETECT_SERVER || 'true');
const logRichPresenceKeys = isTruthy(process.env.LOG_RICH_PRESENCE_KEYS);
const fallbackServer = readString(process.env.PLAYING_ON_SERVER);
const gamePlatform = resolvePlatform(process.env.GAME_PLATFORM);
const discordClientId = readString(process.env.DISCORD_CLIENT_ID) || '893911040713191444';
const eaPollIntervalMs = readPositiveInt(process.env.EA_PROCESS_POLL_INTERVAL_MS, 15000);
const eaDetailsText = readString(process.env.EA_ACTIVITY_DETAILS) || 'Playing Apex Legends (EA App)';
const eaStateText = readString(process.env.EA_ACTIVITY_STATE) || 'In game';
let [eaWatcherHandle, eaApexRunning] = [null, false];

function isTruthy(value) {
    return TRUE_VALUES.includes(String(value || '').trim().toLowerCase());
}

function readString(value) {
    if (typeof value !== 'string') { return null; }

    const normalized = value.trim().replace(/^['"]|['"]$/g, '');
    if (!normalized) { return null; }

    const lowered = normalized.toLowerCase();
    if (lowered === 'add server here' || lowered === 'add server here!') {
        return null;
    }

    return normalized;
}

function readPositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }

    return parsed;
}

function resolvePlatform(value) {
    const normalized = (readString(value) || 'steam').toLowerCase();
    if (normalized === 'steam') {
        return normalized;
    }

    if (['ea', 'origin', 'eaapp', 'ea-app'].includes(normalized)) {
        return 'ea';
    }

    if (value) {
        logger.warn(`Unknown GAME_PLATFORM value: ${value}. Falling back to steam mode.`, 'main');
    }

    return 'steam';
}

function getRichPresenceField(richPresence, key) {
    return richPresence.find(data => data.key && data.key.toLowerCase() === key.toLowerCase());
}

function detectServerFromRichPresence(richPresence) {
    const exactKeys = [
        'server',
        'server_name',
        'server_region',
        'region',
        'datacenter',
        'data_center',
        'cluster',
        'location',
        'geo_region'
    ];

    for (const key of exactKeys) {
        const field = getRichPresenceField(richPresence, key);
        if (!field) { continue; }

        const value = readString(field.value);
        if (value) { return value; }
    }

    for (const field of richPresence) {
        if (!field || typeof field.key !== 'string') { continue; }
        if (!/(server|region|data.?center|cluster|location|geo)/i.test(field.key)) { continue; }

        const value = readString(field.value);
        if (value && !value.startsWith('#')) { return value; }
    }

    return null;
}

function detectServerFromProcess(apexProcess) {
    if (!apexProcess || typeof apexProcess.cmd !== 'string') {
        return null;
    }

    const match = apexProcess.cmd.match(/(?:server|region|data[_-]?center|datacenter|cluster)[\s:="']+([a-z0-9_-]+)/i);
    if (!match || !match[1]) {
        return null;
    }

    return readString(match[1]);
}

function buildStateLabel(baseState, serverLabel) {
    if (showServer && serverLabel) {
        return `${serverLabel} | ${baseState}`;
    }

    return baseState;
}

function normalizeLevelKey(levelValue) {
    if (!levelValue || typeof levelValue !== 'string') {
        return null;
    }

    let normalized = levelValue.toLowerCase();
    if (Translation[normalized]) {
        return normalized;
    }

    const suffixPatterns = [
        /_mu\d+$/,
        /_hu$/,
        /_desc$/,
        /_night\d*$/,
        /_holiday$/,
        /_64k$/,
        /_s\d+$/,
        /_ltm\d*$/,
        /_event\d*$/,
        /_takeover\d*$/
    ];

    let changed = true;
    while (changed) {
        changed = false;

        for (const suffixPattern of suffixPatterns) {
            if (suffixPattern.test(normalized)) {
                normalized = normalized.replace(suffixPattern, '');
                changed = true;
            }
        }

        for (const token of Termination) {
            const suffix = `_${token}`;
            if (normalized.endsWith(suffix)) {
                normalized = normalized.slice(0, -suffix.length);
                changed = true;
                break;
            }
        }
    }

    return normalized || null;
}

async function loginDiscordRpc(contextTag) {
    if (discordReady) {
        return;
    }

    try {
        await RPC.login({ clientId: discordClientId });
    } catch (error) {
        logger.warn(`Failed to connect Discord RPC (${contextTag}): ${error.message}`, 'main:RPC');
    }
}

async function clearDiscordActivity(contextTag) {
    if (!discordReady) {
        return;
    }

    try {
        await RPC.clearActivity();
    } catch (error) {
        logger.debug(`Failed to clear Discord activity (${contextTag}): ${error.message}`, 'main:RPC');
    }
}

async function updateEaActivity(apexProcess) {
    if (!discordReady) {
        return;
    }

    const detectedServer = detectServerFromProcess(apexProcess);
    const serverForDisplay = detectedServer || fallbackServer;
    if (detectedServer && detectedServer !== lastDetectedServer) {
        logger.info(`Detected server/region from process command line: ${detectedServer}`, 'main:ea');
        lastDetectedServer = detectedServer;
    }

    if (!startTimestamp) {
        startTimestamp = new Date();
    }

    await RPC.setActivity({
        details: eaDetailsText,
        state: buildStateLabel(eaStateText, serverForDisplay),
        startTimestamp,
        largeImageKey: 'apex-legends',
        largeImageText: `ApexRPC v${appVersion}`,
        instance: false
    });
}

async function refreshEaWatcher() {
    const apexProcesses = await find('name', 'r5apex', true);
    const apexProcess = apexProcesses[0];
    const isRunning = Boolean(apexProcess);

    if (isRunning && !eaApexRunning) {
        logger.info('Detected Apex process in EA mode. Starting Discord presence updates.', 'main:ea');
    }

    if (!isRunning && eaApexRunning) {
        logger.info('Apex process stopped in EA mode. Clearing Discord activity.', 'main:ea');
        await clearDiscordActivity('main:ea');
        [startTimestamp, playState] = [null, 0];
    }

    eaApexRunning = isRunning;
    if (!isRunning) {
        return;
    }

    if (!discordReady) {
        await loginDiscordRpc('main:ea');
        return;
    }

    await updateEaActivity(apexProcess);
}

function startEaWatcher() {
    if (eaWatcherHandle) {
        return;
    }

    logger.info(`EA mode is enabled. Polling Apex process every ${eaPollIntervalMs}ms.`, 'main:ea');
    refreshEaWatcher().catch((error) => {
        logger.warn(`EA watcher bootstrap failed: ${error.message}`, 'main:ea');
    });

    eaWatcherHandle = setInterval(() => {
        refreshEaWatcher().catch((error) => {
            logger.warn(`EA watcher failed: ${error.message}`, 'main:ea');
        });
    }, eaPollIntervalMs);
}

/* Main:STEAM */
logger.info(`ApexRPC v${appVersion}`, 'main');
if (gamePlatform === 'steam') {
    logger.info('Platform: Steam (full rich presence).', 'main');
    logger.info('Logging in...', 'main:steam');
    SteamClient.logOn({
        accountName: process.env.STEAM_USERNAME,
        password: process.env.STEAM_PASSWORD,
        machineName: `ApexRPC@${appVersion}`,
        dontRememberMachine: false
    });
} else {
    logger.info('Platform: EA App (experimental process-based presence).', 'main');
    startEaWatcher();
}

SteamClient.on('error', function(e) {
    if (e.eresult === 5) {
        return logger.error('Failed to login, Wrong password.', 'main:steam');
    }

    return logger.error(`Failed to login, Steam error with code: ${e.eresult}`, 'main:steam');
});

SteamClient.on('steamGuard', async function(domain, callback) {
    const response = await prompts({ type: 'text', name: 'code', message: 'Steam Guard: ' });
    if (!response || !response.code) {
        SteamClient.logOff();
        return logger.error('No Steam Guard code entered.', 'main:steam');
    }

    callback(response.code);
});

SteamClient.on('loggedOn', async function(details) {
    logger.info(`Logged in with steam vanity url: ${details.vanity_url}, Welcome.`, 'main:steam');
    SteamClient.setPersona(SteamUser.EPersonaState.Online);

    if (!launchApexIfNecessary) {
        logger.debug('`LAUNCH_APEX_IF_NECESSARY` env is not set.', 'main:steam');
        return;
    }

    const r5apex = await find('name', 'r5apex', true);
    if (r5apex.length > 0) {
        logger.debug(`Apex Legends is already running, bailing out.`, 'main:steam');
        return;
    }

    const steamReg = new Registry({ hive: Registry.HKCU, key: '\\Software\\Valve\\Steam\\ActiveProcess' });
    steamReg.values((err,res) => {
        if (err){
            logger.debug(`Steam is not installed, or the registry is mismatch, bailing out.`, 'main:steam');
            return;
        }

        logger.debug('Automatically launching Apex Legends due to `LAUNCH_APEX_IF_NECESSARY` env is set.', 'main:steam');
        exec('start "" steam://run/1172470', (error, stdout, stderr) => {
            if (error) {
                return logger.error(`Error while launching Apex Legends: ${error.message}`);
            }

            logger.info('Launched Apex Legends for you, Have fun!', 'main:steam')
        });
    });
});

SteamClient.on('playingState', function(blocked, playingApp) {
    if (playingApp == 1172470) {
        logger.info(`Seems you started to playing Apex Legends (AppID: ${playingApp}), Firing up DiscordRPC.`, 'main:steam');
        loginDiscordRpc('main:steam');
    } else {
        logger.info(`Seems you stopped to playing Apex Legends (AppID: ${playingApp}), Clearing Discord activity.`, 'main:steam');
        clearDiscordActivity('main:steam');
        [startTimestamp, playState] = [null, 0];
    }
});

SteamClient.on('disconnected', function(eresult, msg) {
    return logger.warn(`Disconnected with code: ${Number(eresult)}`, 'main:steam');
});

SteamClient.on('user', async function(sID, user) {
    if (!discordReady || sID.accountid !== SteamClient.steamID.accountid || !user.rich_presence) { return; }

    const richPresence = user.rich_presence;
    const status = getRichPresenceField(richPresence, 'status');
    const steam_player_group_size = getRichPresenceField(richPresence, 'steam_player_group_size');
    const detectedServer = autoDetectServer ? detectServerFromRichPresence(richPresence) : null;
    const serverForDisplay = detectedServer || fallbackServer;

    if (detectedServer && detectedServer !== lastDetectedServer) {
        logger.info(`Detected server/region from rich presence: ${detectedServer}`, 'main:user:server');
        lastDetectedServer = detectedServer;
    }

    if (logRichPresenceKeys) {
        const richPresenceDump = richPresence
            .filter(data => data && data.key)
            .map(data => `${data.key}=${data.value}`)
            .sort()
            .join('; ');

        if (richPresenceDump !== lastRichPresenceDumpSignature) {
            logger.info(`Rich presence payload: ${richPresenceDump}`, 'main:user:rich_presence');
            lastRichPresenceDumpSignature = richPresenceDump;
        }
    }

    if (
        status && (
            status.value === "#PL_FIRINGRANGE" ||
            status.value === "#PL_TRAINING" ||
            status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SHORT" ||
            status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SHORTPLUS" ||
            status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SQUADSLEFT"
        )
    ) {
        if (status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SQUADSLEFT") {
            playState = 2;
        } else if (status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SHORT") {
            playState = playState + 1;
        }

        if (!startTimestamp) { startTimestamp = new Date(); }
    } else {
        [startTimestamp, playState] = [null, 0];
    }

    const activity = {
        details: "",
        state: "",
        startTimestamp,
        largeImageKey: "apex-legends",
        largeImageText: `ApexRPC v${appVersion}`,
        instance: false
    };

    if (!status && !steam_player_group_size) {
        activity.details = Translation["#MAINMENU"];
    } else if (!status && steam_player_group_size) {
        const steam_player_group = getRichPresenceField(richPresence, 'steam_player_group');
        if (!steam_player_group) {
            activity.details = Translation["#MAINMENU"];
        } else {
            activity.details = Translation["#LOADINGSCREEN"];
        }
    } else if (status.value === "#PL_FIRINGRANGE") {
        if (steam_player_group_size && steam_player_group_size.value > 1) {
            activity.details = Translation["#PL_FIRINGRANGE-PARTY"];
        } else {
            activity.details = Translation["#PL_FIRINGRANGE-ALONE"];
        }

        activity.largeImageKey = "firing-range";
    } else if (
        status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SHORT" ||
        status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SHORTPLUS" ||
        status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SQUADSLEFT" ||
        status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_TEAMSCORES2"
    ) {
        const gamemode = getRichPresenceField(richPresence, 'gamemode');
        const level = getRichPresenceField(richPresence, 'level');

        const parsedLevel = normalizeLevelKey(level && level.value ? level.value : null);

        activity.details = `${
            gamemode && Translation[gamemode.value] ? Translation[gamemode.value] : "Unknown Mode"
        }: ${
            parsedLevel && Translation[parsedLevel] ? Translation[parsedLevel] : "Unknown Map"
        }`;

        if (!level || !Translation[parsedLevel]) {
            logger.warn(`UNKNOWN LEVEL: ${parsedLevel}`, 'main:user:rpc');
        }

        if (
            status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SHORT" ||
            status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SHORTPLUS" ||
            status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_SQUADSLEFT"
        ) {
            const squadsleft = getRichPresenceField(richPresence, 'squadsleft');
    
            if (playState === 2) {
                if (squadsleft) { activity.details += ` (${squadsleft.value} Squads Left)`; }
            } else if (!gamemode || gamemode.value !== "#TDM_NAME") {
                activity.details += ` (${playState === 1 ? "Legend Selection" : "Epilogue"})`;
            }
        }
        
        if (
            status.value === "#RICHPRESENCE_PLAYING_MULTIPLAYER_TEAMSCORES2"
        ) {
            const friendlyscore = getRichPresenceField(richPresence, 'friendlyscore');
            const enemyscore = getRichPresenceField(richPresence, 'enemyscore');
    
            if (friendlyscore && enemyscore) {
                activity.details += ` (${friendlyscore.value} - ${enemyscore.value})`;
            }
        }

        if (level && Gallery[parsedLevel]) {
            activity.largeImageKey = Gallery[parsedLevel]
        }
    } else {
        activity.details = Translation[status.value] ? Translation[status.value] : "UNKNOWN, CONTACT HOLFZ";
        if (!Translation[status.value]) {
            logger.warn(`UNKNOWN STATE: ${status.value}`, 'main:user:rpc');
            logger.warn(`Report this data to holfz: `);
            console.log(richPresence);
        }
    }

    if (steam_player_group_size) {
        const partySize = Number(steam_player_group_size.value);
        const partyState = partySize > 1 ? 'In the party' : 'In the party alone';
        activity.state = buildStateLabel(partyState, serverForDisplay);
        [activity.partySize, activity.partyMax] = [Number.isNaN(partySize) ? 1 : partySize, 3]; // NOTE: THIS IS HARDCODED
    } else {
        const noPartyState = 'Not joining any party';
        activity.state = buildStateLabel(noPartyState, serverForDisplay);
    }
    await RPC.setActivity(activity);
    
});

/* main:RPC */
RPC.on('ready', () => {
    logger.info('Discord RPC is ready.', 'main:RPC');
    discordReady = true;

    if (gamePlatform === 'ea') {
        refreshEaWatcher().catch((error) => {
            logger.warn(`EA refresh after RPC ready failed: ${error.message}`, 'main:ea');
        });
    }
});

RPC.on('disconnected', () => {
    logger.warn('Discord RPC disconnected.', 'main:RPC');
    discordReady = false;
});

RPC.on('error', (error) => {
    logger.warn(`Discord RPC error: ${error.message}`, 'main:RPC');
});