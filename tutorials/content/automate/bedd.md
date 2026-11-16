# Drive the game client with Be.D.D.

At the end of this tutorial Minecraft Bedrock runs in the background of your PC, driven by a script you wrote: the script reads the screen in front as text, takes a screenshot, and closes the game again. You never touch the game window, and you can keep using your mouse and keyboard meanwhile. This is what Be.D.D. (Bedrock Deep Dive) is for: end-to-end tests of LeviLamina client mods, and anything else that needs a real game client under a program's control.

It takes about half an hour, most of it downloading the game.

::: warning A testing tool
A game with Be.D.D. in its `mods\` ignores your real mouse and keyboard and shows only in the Be.D.D. manager window. Be.D.D. installs itself only into its own copies of the game, never into an instance you play.
:::

## What you need

- A Windows 10 or 11 PC (x64).
- A Microsoft account that owns Minecraft for Windows.
- [LeviLauncher](https://levimc.org/LeviLauncher/) 1.1 or newer. If you have not installed it yet, follow steps 1 and 2 of [Play with mods on Windows](../play/play-with-mods.md).
- [Node.js](https://nodejs.org/) 24 or newer, for the script. Check with `node -v`.

You need no PowerShell modules, `lip` or .NET runtime.

## 1. Install the base game

Be.D.D. 0.4 drives Minecraft **1.26.60** (the GDK release) with LeviLamina **26.60.x**. It copies that instance of LeviLauncher and never changes or starts the original, which is called the **base**.

In a terminal, run LeviLauncher's command line (use the full path to `LeviLauncher.exe` if it is not on your `PATH`):

```powershell
LeviLauncher.exe account login              # once per PC: sign in with the account that owns Minecraft
LeviLauncher.exe install 1.26.60 --loader   # the 1.26.60 GDK release, with LeviLamina
LeviLauncher.exe instance list              # check the result
```

You should see an instance with a game version `1.26.60.xx` and a loader `26.60.x` in the list.

If you prefer the window of LeviLauncher, add the version 1.26.60 with LeviLamina there, as in step 3 of [Play with mods on Windows](../play/play-with-mods.md); the result is the same.

## 2. Install Be.D.D.

1. Download `bedd-windows-x64-setup.exe` from the [latest release](https://github.com/LiteLDev/BeDD/releases/latest) and run it. It needs no administrator rights: it installs for your user into `%LOCALAPPDATA%\Programs\BeDD`, adds a **BeDD** entry to the Start menu and puts the folder on your `PATH`.
2. Open a **new** terminal and run:

   ```powershell
   BeDD.exe version
   ```

   You should see `Be.D.D. 0.4.0` (or newer) and the game and LeviLamina versions it drives.

::: details Without the installer
`bedd-windows-x64.zip` from the same release works unzipped anywhere: run `BeDD.exe` from its folder. `bedd-windows-x64.msi` installs silently with `msiexec /i bedd-windows-x64.msi /qn`, for managed PCs and CI.
:::

## 3. Start a game in the background

```powershell
BeDD.exe launch --slot 1 --json
```

`launch` does everything at once:

1. It makes a **clone** of the base, named `<game version>-<slot>`, such as `1.26.60.05-1`. A clone has its own `mods\`, worlds, options and logs; the game files are hard links to the base, so it takes almost no space.
2. It installs the Be.D.D. mod into the clone.
3. It starts the game in the background, opens the **manager window**, waits until the game is ready, prints one line of JSON and exits. The game keeps running.

You should see a line like:

```json
{"pid":12345,"instance":"1.26.60.05-1","instanceDir":"…","url":"ws://127.0.0.1:53021/v1","token":"9f3c…","label":"…"}
```

and the manager window, which shows the game. `url` and `token` are how a script talks to the game: every game serves a WebSocket on `127.0.0.1`, and the token is new at each start.

`BeDD.exe ps` lists the running games at any time.

## 4. Write your first script

A script sends one JSON request per message, such as `{"id": 1, "op": "ping"}`, and gets one reply with the same `id` once the game has handled it. Create a folder, and in it the file `hello-bedd.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

// Find the game: `BeDD.exe ps --json` lists every running game with its url and token.
const games = JSON.parse(execFileSync('BeDD.exe', ['ps', '--json'], { encoding: 'utf8' }));
const game = games.find((g) => g.kind === 'client' && g.status === 'ready');
if (!game) throw new Error('No game runs: start one with BeDD.exe launch --slot 1');

// Connect, and send requests with call(op, fields): it resolves with the reply.
const ws = new WebSocket(`${game.url}?token=${game.token}`);
const waiting = new Map();
let nextId = 1;
ws.onmessage = (event) => {
  if (typeof event.data !== 'string') return; // binary frames are packet data, not replies
  const reply = JSON.parse(event.data);
  waiting.get(reply.id)?.(reply);
  waiting.delete(reply.id);
};
const call = (op, fields = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  waiting.set(id, (r) => (r.ok ? resolve(r) : reject(new Error(`${op}: ${r.error}`))));
  ws.send(JSON.stringify({ id, op, ...fields }));
});
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

// 1. What can this game do?
const ping = await call('ping');
console.log('instance:', game.instance, '| default mode:', ping.defaultMode);

// 2. Read the screen in front as text.
const { view } = await call('ui');
console.log(view);

// 3. Take a screenshot. It works while the window is hidden.
const shot = await call('screenshot', { format: 'png' });
writeFileSync('screen.png', Buffer.from(shot.data, 'base64'));
console.log(`saved screen.png (${shot.width}x${shot.height})`);

ws.close();
```

Run it:

```powershell
node hello-bedd.mjs
```

You should see the instance name, `default mode: bedboo`, and the title screen as text, something like:

```text
screen start_screen
- button "Play" [e1]
- button "Settings" [e2]
- text "v26.60/LeviLamina-26.60.5"
```

and the file `screen.png` next to the script, showing the title screen. The `[e1]` after a control is its **ref**: `call('ui', { action: 'click', ref: 'e1' })` would press **Play**.

## 5. Stop the game

```powershell
BeDD.exe stop 1.26.60.05-1
```

Use the instance name that `launch` printed. You should see `stopped 1.26.60.05-1 (pid …)`, and the game leaves the manager window. Closing it there works too.

The clone stays for next time: `BeDD.exe launch --slot 1` starts it again in a few seconds. `--slot 2` makes a second clone, so that two games run side by side.

## What you have now

- Be.D.D. installed, with a clone of Minecraft 1.26.60 that runs in the background.
- A script that finds a running game, talks to it over its WebSocket, reads its screen and takes screenshots.

## Next steps

- Which way to drive the game, and why: bedboo ops first, then the UI tree, then simulated input: [Operation modes](https://levimc.org/BeDD/guide/operation-modes.html).
- Move, look, use items and fight with a mineflayer-style bot: [Your first bedboo bot](first-bedboo-bot.md), then bedboo's [Be.D.D. transport](https://levimc.org/bedboo/guide/bedd.html).
- Read and click menus: [UI tree](https://levimc.org/BeDD/reference/ui.html). Every request and its fields: [WebSocket API](https://levimc.org/BeDD/reference/websocket.html).
- Several games at once, and the manager window: [Several games](https://levimc.org/BeDD/guide/several-games.html).
- Test a client together with a dedicated server: [Modes](https://levimc.org/BeDD/guide/modes.html).
- Settings of the mod, such as the window size: [Configuration](https://levimc.org/BeDD/guide/configuration.html).
- Something does not work: [Troubleshooting](https://levimc.org/BeDD/guide/troubleshooting.html).
