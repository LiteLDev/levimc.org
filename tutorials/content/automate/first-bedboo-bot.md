# Your first bedboo bot

At the end of this tutorial a bot you wrote in JavaScript joins your Bedrock server, says hello in the chat, answers what players say, and walks to you when you type `come`. It is built with bedboo, a Bedrock bot library with the API of [mineflayer](https://github.com/PrismarineJS/mineflayer): if you have written a mineflayer bot before, the bot code is the same.

It takes about half an hour.

## What you need

- A Bedrock Dedicated Server (BDS) between **1.26.42.1** and **1.26.63.1**, on your PC or your network. A server from [Your first server](../server/first-server.md) works; this tutorial uses `D:\servers\survival`.
- [Node.js](https://nodejs.org/) **24** or newer and [Git](https://git-scm.com). On Windows, Linux or macOS, on an **x64** processor (the RakNet connection used here has no ARM builds).
- Minecraft Bedrock, to talk to the bot in the game. Without it you can still do steps 1 to 5.

Check Node.js in a terminal:

```shell
node -v
```

You should see `v24` or higher.

## 1. Get bedboo

bedboo is not published to npm yet. It fixes a few of its dependencies with pnpm patches that apply only inside its own workspace, so you use it from its repository:

```shell
git clone https://github.com/LiteLDev/bedboo
cd bedboo
corepack enable
pnpm install
```

`corepack enable` provides pnpm in the version the repository asks for. You should see pnpm finish with the list of installed packages and no error.

::: details `corepack` is not found, or not allowed
Node.js 25 and newer no longer include corepack: install it with `npm install -g corepack`, then run `corepack enable` again. On Windows, if Node.js is installed in `C:\Program Files`, run `corepack enable` once in a terminal opened as administrator.
:::

## 2. Make a package for your bot

Your bot lives in a package of the workspace, so that it gets its own dependencies.

1. Create the folder `packages/my-bot` in the repository.
2. In it, create `package.json`:

   ```json
   {
     "name": "my-bot",
     "private": true,
     "dependencies": {
       "bedboo": "workspace:*",
       "mineflayer-pathfinder": "2.4.5"
     }
   }
   ```

   `bedboo` comes from the workspace. `mineflayer-pathfinder` is the usual mineflayer plugin for walking to places; it works on Bedrock with a patch that the bedboo workspace applies to it, and your code uses it as on Java Edition.

3. In the root of the repository, run `pnpm install` again. You should see it add `mineflayer-pathfinder`.

## 3. Prepare the server

The bot in this tutorial has no Xbox Live account, and it connects over RakNet. Tell the server so:

1. Stop the server.
2. Open `server.properties` in the server folder and set:

   ```properties
   transport=raknet
   online-mode=false
   allow-list=false
   server-port=19132
   ```

   | Setting | Why |
   | --- | --- |
   | `transport=raknet` | BDS 1.26.51 and newer use NetherNet by default; bedboo connects over RakNet unless told otherwise. |
   | `online-mode=false` | A bot with `auth: 'offline'` has no Xbox Live identity. |
   | `allow-list=false` | Otherwise, add the bot's name to `allowlist.json`. |

3. Start the server and wait for `Server started.` Note the game version the server prints at startup, such as `1.26.60`: the bot needs it.

::: warning Keep an offline server private
With `online-mode=false` anybody can join under any name. Keep such a server on your own network, or keep `online-mode=true` and give the bot a Microsoft account (`auth: 'microsoft'`, see the [API](https://levimc.org/bedboo/reference/api.html)).
:::

A line `TRANSPORT TYPE ERROR … not set to NetherNet` right after `Server started.` is harmless: BDS warns that vanilla clients may soon need NetherNet. RakNet clients connect fine.

## 4. Write the bot

Create `packages/my-bot/index.js`:

```js
const bedboo = require('bedboo') // instead of require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

const bot = bedboo.createBot({
  host: process.argv[2] ?? '127.0.0.1',
  port: parseInt(process.argv[3] ?? '19132'),
  version: process.argv[4], // the server's game version, such as '1.26.60'
  username: 'Bot',
  auth: 'offline'
})
bot.loadPlugin(pathfinder)

bot.once('spawn', () => {
  console.log(`spawned at ${bot.entity.position} in ${bot.game.dimension} (${bot.game.gameMode})`)
  bot.chat('hello!')
})

bot.on('chat', async (username, message) => {
  if (username === bot.username) return
  if (message === 'come') {
    const target = bot.players[username]?.entity
    if (!target) return bot.chat("I can't see you")
    bot.pathfinder.setMovements(new Movements(bot))
    try {
      await bot.pathfinder.goto(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 1))
      bot.chat('here!')
    } catch (err) {
      bot.chat(`I can't get there: ${err.message}`)
    }
  } else {
    bot.chat(message) // repeat everything else
  }
})

bot.on('kicked', (reason) => console.log('kicked:', reason))
bot.on('error', (err) => console.log('error:', err))
bot.on('end', (reason) => console.log('disconnected:', reason))
```

What it does:

- `createBot` connects to the server. `version` is the server's game version; bedboo takes the exact BDS build (`1.26.62.1`) or its family (`1.26.60`). Without it, the bot speaks 1.26.51.
- `spawn` fires once the bot is in the world; `chat` fires for every chat message, with the sender's name.
- `bot.pathfinder.goto` walks to a goal, here within one block of the player.

Blocks and items have their Bedrock names (`grass_block`, `oak_log`, …); everything else is mineflayer's API.

## 5. Run it

In the root of the repository, with the version of your server:

```shell
node packages/my-bot/index.js 127.0.0.1 19132 1.26.60
```

You should see `spawned at (…) in overworld (survival)` in your terminal within a few seconds. In the server, type `list`: you should see `There are 1/10 players online:` and `Bot`.

Press `Ctrl+C` to disconnect the bot.

## 6. Talk to it

1. Start the bot again, and join the server from Minecraft (on the same PC: address `127.0.0.1`, port `19132`).
2. Type anything in the chat: the bot repeats it.
3. Type `come`: the bot walks to you and says `here!`.

To let the bot run commands with `bot.chat('/time set day')`, set `allow-cheats=true` in `server.properties` and make it an operator from the server console: `op Bot`.

::: details The bot does not join
| Symptom | Cause |
| --- | --- |
| `Connect timed out` | Wrong host or port, the server's `transport` is not `raknet`, or a firewall drops UDP. |
| `kicked` right after joining | `allow-list=true` without the bot in `allowlist.json`, or `online-mode=true`. The reason says which. |
| Kicked as an outdated client or server | The `version` you passed is not the server's. |
| The RakNet backend fails to load | Not on x64, or the dependencies were installed outside the bedboo workspace. |
:::

## What you have now

- bedboo in a local workspace, with your bot as a package of it.
- A server that bots can join, and a bot that chats and walks with the pathfinder plugin.

## Next steps

- Other mineflayer plugins on Bedrock: pvp, collecting blocks and more: [Ecosystem plugins](https://levimc.org/bedboo/guide/plugins.html).
- Every `createBot` option and the Bedrock extras, NetherNet and Microsoft accounts included: [API](https://levimc.org/bedboo/reference/api.html).
- What differs from Java Edition bots: [Bedrock differences](https://levimc.org/bedboo/reference/differences/).
- The supported server versions: [Supported versions](https://levimc.org/bedboo/reference/versions/).
- A ready-made bot that plays survival: [Survival agent](https://levimc.org/bedboo/guide/agent.html).
- How BDS behaves towards bots: [BDS notes](https://levimc.org/bedboo/reference/bds.html).
- Drive a real game client instead of a protocol bot: [Drive the game client with Be.D.D.](bedd.md)
- What bedboo is and how it is built: [bedboo](https://levimc.org/bedboo/).
