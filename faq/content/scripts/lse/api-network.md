# LegacyScriptEngine API: network and system

## Is there a way to get which IP a player used to join the server, from an LSE plugin?

Yes, through the player's device information object: `player.getDevice().ip` (the `ip` property of the Device object).

Note: if the server sits behind an intranet tunnel / proxy such as frp, you get the address of the tunnel client (for example `127.0.0.1`), not the player's real IP.

*Applies to: all current LSE versions (including v0.23.1)*

## How can an LSE plugin update itself automatically?

Check for updates periodically (for example by requesting version information with `network.httpGet`). When a new version is found, download it, overwrite the plugin's own file, and then reload yourself by running LeviLamina's reload command (such as `ll reload <plugin name>`) with `mc.runcmdEx`. Fetching code from the network on every load and running it with `eval` is not recommended.

*Applies to: LeviLamina + LSE current version*

## Does LSE have an interface to get the server's public IP?

There is no dedicated interface (LSE only has the `ip` property of a player / device, such as `pl.getDevice().ip`). You can use LSE's network interface `network.httpGet(url, callback)` to request an external IP lookup service (such as <https://ip.sb> or <https://4.ipw.cn>) and get the public IP; a Node.js plugin can also do this with Node's network libraries.

*Applies to: all current LSE versions*

## What should I pass to `writeVec3` in LSE's `BinaryStream`? Is it different from calling `writeFloat` three times?

`writeVec3` takes a `FloatPos`. It writes x, y and z with `writeFloat` in turn, so it is equivalent to calling `writeFloat` three times.

## Can LSE Node.js plugins share memory with each other? How can a Node plugin notify an external front-end program once the server has finished starting?

They cannot share memory directly; LSE isolates the execution environment of each Node.js plugin. When plugins need to call each other, use `ll.exports` / `ll.imports` (remote function calls). To communicate with an external program, use the network: in the `onServerStarted` event, notify the program through an HTTP request (`network.httpGet` / `httpPost` or Node's built-in `http` module) or a WebSocket (LSE's `WSClient`, or the npm `ws` package). To monitor whether the server is alive, you can send periodic WebSocket heartbeats and treat a timeout as a server crash. Exchanging data through files is less reliable than using the network. Users report that `process.send` does not work.

*Applies to: current version (Node.js engine)*

## In an LSE JS script plugin, can I keep a joining player on the "Loading resources" screen with almost no packets sent, and decide whether to let them in only after a `Promise` resolves?

Script plugins cannot suspend a player's connection during login/resource loading or control which packets are sent. Event callbacks such as `onPreJoin` are synchronous: they can only decide on the spot whether to intercept, and cannot wait for a `Promise`. You need a C++ mod that hooks the network/login flow yourself.

## In LSE, building an `AddActor` packet with `BinaryStream` and sending it with `createPacket` fails or reports a parameter error. Why? Does using the `sendNetworkPacket` symbol fix it?

By default, `bs.createPacket(pktid)` first creates a packet object of the matching type and then reads it from the `BinaryStream` for parsing and validation. Some packets (such as `AddActor`) fail to parse when built from hand-assembled data. Since LSE 0.19.1 you can use `bs.createPacket(pktid, true)` to create a raw network packet that sends the bytes currently in the stream as the packet body without parsing, then send it with `pkt.sendTo(player)` or `player.sendPacket(pkt)`. `?sendNetworkPacket@Player@@UEBAXAEAVPacket@@@Z` is essentially the same as `player.sendPacket`, so switching to it does not solve the problem. Also, backslashes in a symbol written in a JS string must be escaped, or use `String.raw`.

*Applies to: LegacyScriptEngine 0.19.1 and later (raw parameter); earlier versions cannot send `AddActor` with `createPacket`*

## After I change a map art's (the map in an item frame) NBT or the pixel data for a mapid on the server, the client does not refresh. How do I make the client show the update?

The server data has actually changed; the client just was not sent an update packet. The client requests map data by sending `MapInfoRequestPacket` (`mMapId`, `mClientPixels`), and the server replies with `ClientboundMapItemDataPacket`; `UpdateBlockActorPacket` only tells the client the map id in the item frame. When the map id stays the same and only the data changes, you can send an `UpdateBlockPacket` to trigger a block update so the client requests the map data again (reloading with a command block `clone`, `structure`, or `pl.refreshChunks()` can also force a refresh, but it flickers). LSE can send packets directly with `pl.sendPacket`, but you must write the `BinaryStream` by hand; for the protocol see <https://mojang.github.io/bedrock-protocol-docs/html/packets.html>. Note that every update is sent to all players and uses bandwidth.

*Applies to: LSE / LeviLamina current version (packet details depend on the BDS protocol). Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I transfer a player between two Bedrock servers? Can data be shared between them?

The transfer itself is simple: LSE provides `pl.transServer(ip, port)`; a C++ mod can construct a `TransferPacket` from `<mc/network/packet/TransferPacket.h>` (passing the target IP and port) and send it with `player.sendNetworkPacket`. However, data on each server (including each plugin's data) is not shared automatically. You need to synchronize it yourself through shared storage such as MySQL, or through files or WebSocket relaying.

*Applies to: LSE / LeviLamina current version*

## I want to write a `/ping` command that shows a player's latency to the server. Do LSE or LeviLamina have an interface that gets player latency directly?

You do not need to ping the player's IP from the server (the IP you get is often an ISP exit address, and ping is usually blocked). In LSE, use the device info object returned by `pl.getDevice()`: `dv.lastPing` (current latency in ms) and `dv.avgPing` (average latency in ms), plus the packet loss rates `lastPacketLoss`/`avgPacketLoss`. C++ mod developers can look at how these properties are implemented in the LSE source file `DeviceAPI.cpp`.

*Applies to: LegacyScriptEngine current version*

## The server already has custom join/leave messages. How do I turn off the vanilla yellow "xxx joined/left the game" message? Can returning `false` from a `mc.listen('onJoin'/'onLeft')` callback in LSE block it?

You cannot turn the message off this way: `onLeft` cannot be intercepted, and although `return false` in `onJoin` can intercept, it blocks the player-join event itself, not that message.

Workable methods:

1. Use a resource pack to change `multiplayer.player.joined` / `multiplayer.player.left` in the language file.
2. Intercept the `TextPacket` sent to the client. In LSE you can use the third-party ila-lseexport (which exports iListenAttentively events) to listen to the packet-send event and intercept it. In a C++ mod you can depend on iListenAttentively's `SendPacketBeforeEvent`: `if (event.packet().getId() == MinecraftPacketIds::Text) event.cancel();` (then filter by the text content).

*Applies to: LegacyScriptEngine / iListenAttentively current version*

## When I build a fake chest (fake chest) inspection UI by sending packets with LSE, opening a large chest (double chest) closes immediately. How do I fix it?

When the client opens a container UI, it requires a chest block to exist at the corresponding position; otherwise the UI closes immediately. You first need to send the player fake chest blocks (a large chest needs two adjacent, paired chests), usually placed near the top of the player's head, and then send a `ContainerOpenPacket` to open the UI. In LSE you can build the packet with `BinaryStream` and send it with `pl.sendPacket(packet)`. See the community example: <https://github.com/Cdm2883/code-snippets/blob/vscode/LLSE/FakeChestLLSE/fake-chest.llse.js>

*Applies to: current version (depends on client behavior and the specific protocol version). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can the text above a player's head (name tag / floating text) be made visible only to specific players?

Yes. The principle is to send the entity name/metadata change packet (such as `SetActorDataPacket`) only to the target player; other players never receive it, so they do not see it. In LSE you can build the packet with the Packet API (write data into `new BinaryStream()`, then `bs.createPacket(pktid)`) and send it only to the chosen player with `pl.sendPacket(packet)`; you can also use another dependency plugin that provides a packet-sending or floating-text interface. Note that the Packet API must be available in your version, and packet structures change with the BDS protocol version, so build them for the current protocol.

*Applies to: LegacyScriptEngine current version*

## In LSE, the status code returned by `network.httpGet()` is always `-1`, but the same URL works in a browser. Why?

Status code `-1` means the request itself failed (no response was received). First print the assembled URL to check that it is correct, and check the request parameters and the server. One user hit this because of a domain name resolution failure; using the IP address instead fixed it. You can also test with `curl`, or use another HTTP library in a Node.js plugin.
