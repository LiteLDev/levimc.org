# How bedboo works

bedboo is mineflayer with the Java parts taken out and Bedrock parts put in. The API a bot sees is mineflayer's; under
it, the connection, the game data, the plugins that implement `bot.*` and the physics engine are Bedrock ones. This
page shows those layers and how a bot's call travels through them. What each layer does differently from Java, entry
by entry, is in the [Bedrock differences](../reference/differences/index.md).

## The layers {#layers}

```text
your script, ecosystem plugins (pathfinder, pvp, …)
        │  the mineflayer API: createBot(), bot.*, events
        ▼
bedboo's plugins (one file per mineflayer plugin)  ── bot.registry (minecraft-data + @bedboo/bedrock-data)
        │  Bedrock packets                         ── bot._bedrock (input queue, lifecycle, item stack requests, …)
        ▼
bot._client
        ├── bedrock-protocol over RakNet (raknet-native)     transport: 'raknet', the default ──┐
        ├── bedrock-protocol over NetherNet (node-nethernet) transport: 'nethernet' ────────────┤
        └── a real client hosted by Be.D.D.                  transport: 'bedd' ─────────────────┤
                                                                                                ▼
                                                                                    Bedrock Dedicated Server
```

## createBot and the plugins {#plugins}

`createBot()` is mineflayer's loader (`lib/loader.js`), adapted: the same options, the same plugin selection and the
same order of events, with a bedrock-protocol client instead of minecraft-protocol. `bot.loadPlugin()` is mineflayer's
own plugin loader, which is why ecosystem plugins load unchanged.

The internal plugins are the ones that make up `bot.*`. bedboo has one file for every plugin name of mineflayer
4.39.0 (41 of them: `blocks`, `chat`, `digging`, `entities`, `inventory`, `physics`, …), plus `abilities` (from
mineflayer's master branch) and `sign` (sign editing, split out of `blocks`). Each is adapted from mineflayer's file
of the same name and keeps its attribution header: the argument checks, return values, error messages and events stay
mineflayer's, and the Java packets are replaced by Bedrock ones. So `options.plugins` and `loadInternalPlugins` select
plugins by the same names as in mineflayer.

## The connection {#connection}

bedboo connects through [bedrock-protocol](https://github.com/PrismarineJS/bedrock-protocol), which handles login,
encryption and the packet format of each version. The `transport` option picks what carries the packets:

- **RakNet** (`'raknet'`, the default) through raknet-native. BDS must run with `transport=raknet`.
- **NetherNet** (`'nethernet'`) through [node-nethernet](https://github.com/PrismarineJS/node-nethernet): WebRTC
  data channels, BDS's default transport from 1.26.51 on. By default the signalling goes over HTTP on the server port.
- **A real client** (`'bedd'`): bedboo opens no connection to the server of its own. A Minecraft client hosted by
  [Be.D.D.](https://levimc.org/BeDD/) is in the world; bedboo reads every packet it receives and sends, and turns
  what it would have sent into control requests for that client ([how it works](../guide/bedd.md#how-it-works)).

The bot's API is the same on all three. How to choose and set them up: [Connecting to a server](../guide/connecting.md#transports).

## Versions and game data {#data}

Bedrock versions are grouped into **protocol families**: all BDS builds of a family speak the same network protocol
and share one set of game data. bedboo knows four families, `1.26.40`, `1.26.45`, `1.26.51` (the default) and
`1.26.60`; `bot.version` is the family ([Supported versions](../reference/versions/index.md)). bedboo does not detect
the server's version: a bot for another family names it in `createBot({ version })`.

The game data (blocks, block states, items, entities, effects, biomes, collision shapes, foods, …) comes from
[minecraft-data](https://github.com/PrismarineJS/minecraft-data), overlaid by `@bedboo/bedrock-data`: one
`data/<family>/` folder per family whose datasets replace minecraft-data's `bedrock_<family>` ones. The overlay is
installed as the very first thing `require('bedboo')` does, before bedrock-protocol or a prismarine library reads any
Bedrock data. bedboo also lets `require('minecraft-data')(bot.version)` answer with the Bedrock data, as mineflayer's
documentation promises, so code such as prismarine-physics' `PlayerState` works.

`bot.registry` is built from that data before the first packet, then completed by the server: `start_game` gives the
block runtime ids (hashes of the block states on BDS) and `item_registry` the network ids of the items. Names and ids
are therefore Bedrock's (`wooden_door`, `lit_furnace`, …): see [Names, ids and data](../reference/differences/data.md).

## Bedrock state {#bedrock-state}

Bedrock needs state that Java does not, shared by several plugins. It lives in `bot._bedrock` (internal, it may
change):

- `input`: the tick clock and the queue of `player_auth_input`, the packet the bot sends every tick
  ([Server authority](server-authority.md#input));
- `lifecycle`: join, respawn and dimension changes, the only place that emits `spawn`;
- `stackRequests` and `windows`: item stack requests and the Bedrock containers mapped to Java window types;
- `ids`: runtime and unique entity ids, item network ids.

What a bot may need on Bedrock and mineflayer has no member for is public under `bot.bedrock` (game rules, block
variants, inventory resync, the BeDD capabilities), never as a new top-level `bot` member: see the
[API](../reference/api.md#bedrock-extras).

## Movement {#movement}

The physics plugin runs a movement engine forked from prismarine-physics (`lib/physics/`). It keeps the module shape
and the `bot.physics` field names, so mineflayer-pathfinder can simulate moves with it, but implements Bedrock's
movement rules (step height, friction, jumping, climbing, liquids, …), fitted until it reproduces the server's own
simulation ([Movement and physics](../reference/differences/movement.md#engine)). On Bedrock the server checks every
move: see [Server authority](server-authority.md#movement).

## Dependencies and patches {#patches}

A few fixes to the dependencies (bedrock-protocol, node-nethernet, raknet-native, prismarine libraries) and the Java
assumptions of the ecosystem plugins are `pnpm patch`es in the repository's `patches/` folder. The `overrides` in
`pnpm-workspace.yaml` make every package load the same patched copy. This is why bedboo is used from its monorepo
for now (the [tutorial](https://levimc.org/tutorials/automate/first-bedboo-bot/) shows how), and why the ecosystem
plugins need the same patches outside it ([Ecosystem plugins](../guide/plugins.md),
[Ecosystem plugin patches](../reference/differences/plugins.md)).

The repository holds three packages: `bedboo` (the library), `@bedboo/bedrock-data` (the data overlays) and
`@bedboo/agent` (a [survival agent](../guide/agent.md) built on bedboo).
