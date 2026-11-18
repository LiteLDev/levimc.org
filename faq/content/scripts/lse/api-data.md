# LegacyScriptEngine API: data and files

## Calling `setNbt` after modifying the NBT of a block or block entity in LSE has no effect (for example chest contents, the `map_uuid` of a map in an item frame, or the `powered_bit` of a lectern). How do I modify it correctly?

1. The data of containers and block entities such as chests and item frames is stored in the block entity (BlockEntity), separate from the block's own NBT. Get the block entity with `bl.getBlockEntity()`, modify the result of `be.getNbt()`, and call `be.setNbt(nbt)` on the block entity, not `block.setNbt`. Example:

    ```js
    let bl = mc.getBlock(x, y, z, 0);
    let be = bl.getBlockEntity();
    let a = be.getNbt();
    let b = a.getTag("Item");
    let c = b.getTag("tag");
    c.setLong("map_uuid", -14246406442712);
    b.setTag("tag", c);
    a.setTag("Item", b);
    be.setNbt(a);
    ```

2. When modifying block states, mind the type: boolean states (such as `powered_bit`) are Byte in NBT (`0b`/`1b`), so use `setByte('powered_bit', 1)` rather than `setInt`, and then call `mc.getBlock(pos).setNbt(nbt)`.

While debugging, print `nbt.toSNBT()` to inspect the structure and types.

*Applies to: all current LSE versions*

## How do I create or handle ByteArray NBT in LSE (such as the `"FireworkFade":[B;...]` of a firework)? `new NbtByteArray(Uint8Array.from([15,7,8,...]))` prints as ASCII codes (`[B;49b,53b,44b,...]`). What do I do?

This is an LSE implementation issue: the `NbtByteArray` constructor (and `set`) writes the buffer you pass in character by character as a string (`describeUtf8`), so the array `[15,7,8]` is treated as the text `"15,7,8"` and converted to ASCII codes. Instead, parse SNBT at the C++ level: `NBT.parseSNBT("{FireworkFade:[B;15b,7b,8b]}")` parses a compound, from which you take the byte array and write it back. In the current version `parseSNBT` is based on `CompoundTagVariant::parse` and can also parse `"[B;15b,7b,8b]"` directly and return an `NbtByteArray` (older versions only supported compounds, so you need to wrap the value in one). For existing data, you can also convert it to text with `toSNBT()`, edit it, and write it back with `parseSNBT`.

*Applies to: current LSE version (the NbtByteArray constructor issue still exists in the 0.23.1 source)*

## In LSE, why is a path starting with `/`, such as `new JsonConfigFile("/plugins/xxx/config.json")`, not found or written to the wrong place?

LSE does no special processing on paths and passes them to the file system as-is. A path starting with `/` is an absolute path. On Windows it points to the root of the current drive (such as `C:\plugins\...`), not to the `plugins` folder under the BDS directory. Use a path relative to the BDS root (the working directory), such as `new JsonConfigFile("./plugins/xxx/config.json")`.

## In LSE, how do I look up a player name from a UUID and the other way around?

To get the UUID from a player name, use `data.name2uuid(name)`. To get the player name from a UUID: LSE has no `data.uuid2name`, but you can use `data.fromUuid(uuid)` to get a player info object `{xuid, name, uuid}` and read its `name` (a `null` return means the lookup failed). Related functions are `data.name2xuid` / `data.xuid2name` / `data.xuid2uuid` / `data.fromName` / `data.fromXuid` / `data.getAllPlayerInfo` (`fromUuid` and the like were added in 0.8.13).

*Applies to: LSE 0.8.13 and later*

## In LSE, how do I build an NbtList that represents an integer array?

Build the NbtList from NbtInt elements, for example `new NbtList([new NbtInt(1), new NbtInt(2)])`. The elements of the array must all be NBT objects of the same type; you cannot pass JS numbers directly.

## In LSE, how do I count the UUIDs of all players on the server?

LSE has `data.getAllPlayerInfo()` built in. It returns an array of `{name, xuid, uuid}` for all recorded players. You can run it from the console: enter debug mode with `jsdebug`, then run `data.getAllPlayerInfo().length` (it only includes players who joined after the server installed LeviLamina).

If GMLib and GMLib-LegacyRemoteCallApi are installed, you can also use `ll.imports("GMLIB_API", "getAllPlayerUuids")().length` (a third-party plugin interface, so the corresponding third-party plugin is required).

## How do I read the NBT of a block such as a chest in LSE (for example, whether it is a large chest, or its paired coordinates)? What if the block's NBT doesn't contain that data? Can NBT be used as JSON?

Data such as a chest's lives in the block entity (BlockActor), not in the block (Block) itself, so read the block entity's NBT: `block.getBlockEntity().getNbt()` (check `block.hasBlockEntity()` first). For debugging, convert it to a string with `.toSNBT()` and print it.

NBT is not JSON. To store and load it, use `toSNBT()` / `NBT.parseSNBT()`; do not convert it with `toObject()` and then store it as JSON (type information is lost). If you only read and never write, `toObject` is more convenient. For performance, use binary NBT serialization (`toBinaryNBT` / `NBT.parseBinaryNBT`), which is faster than parsing SNBT.

Also note that BlockActor does not inherit from Actor.

*Applies to: all current LSE versions*

## In an LSE plugin, parsing an item's NBT converted to a string (SNBT) with `JSON.parse()` throws an error. What should I do?

SNBT is not JSON, so you cannot parse the result of `nbt.toSNBT()` with `JSON.parse`. Use LSE's NBT object API directly (such as `comp.getTag(key)` and `comp.getData(key)` on an NbtCompound) to read and modify it; if you really need a plain JS object, use `comp.toObject()`.

*Applies to: all current LSE versions*

## I can't find APIs such as `File.readFrom` in the LSE documentation (the file system page link is broken). Do these APIs still exist?

The APIs still exist; the documentation site was only migrated. The file-related APIs are documented at <https://levimc.org/LegacyScriptEngine/apis/SystemAPI/File/>. `File.readFrom(path[,isBinary])` still works (the `isBinary` parameter is supported since 0.19.1).

If you find something missing from the documentation, you can submit a PR to the LiteLDev/liteldev.github.io repository (`docs/LegacyScriptEngine/content`).

## Does LSE have a unified configuration file interface? Does LeviLamina provide a default configuration directory?

In LSE you generally use `new JsonConfigFile(path[,default])`. The developer decides `path`, and the optional `default` is the default content written when the file does not exist.

At the C++ level, LeviLamina provides default directories for mods: `config`, `data` and `lang` (`Mod::getConfigDir` / `getDataDir` / `getLangDir`). There is no unified configuration mechanism fully managed by the loader.

## Can the KVDB (kvdb database) of LSE/LLSE be accessed by two servers at the same time?

No. LSE's `KVDatabase` is a local database based on LevelDB, and LevelDB allows only one process to open a given database directory at a time, so it does not support access from multiple servers at once. To share data across servers, use a network database such as MySQL (LSE's `DBSession` supports MySQL).

## In an LSE script plugin, how do I get an offline player's information (name, UUID, etc.) from a UUID / XUID? How do I read an offline player's NBT?

Use the offline player lookup interface of the `data` module: `data.fromUuid("<uuid>")` / `data.fromXuid("<xuid>")` returns an object `{xuid, name, uuid}` (empty if not found), for example `data.fromUuid(uuid).name` or `data.fromXuid(xuid).uuid`. LSE's built-in API is not convenient for reading and writing offline player NBT. Consider the offline NBT interface provided by the community plugin LRCA (which exports extended APIs through LegacyRemoteCall).

*Applies to: current version (LRCA is a third-party plugin)*

## When implementing "click a command sign / command block to run a command" in an LSE plugin, commands written into the block entity NBT get wiped. How should I store them?

BDS strips custom NBT it does not recognize from block entities and items, so a command written into block entity NBT is not kept. The recommended approach is to listen to the `onUseItemOn` (or `onBlockInteracted`) event and store "position + dimension + block type -> command" in a config file or database (load it into a map at startup, save it periodically or on change). On click, look up the command by position and run it; if the block type at that position has changed, the original block was destroyed, so delete the record. For an existing LSE plugin, see cmdanyblock: <https://www.minebbs.com/resources/cmdanyblock.3755/>

*Applies to: LSE current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In LSE, after getting a child NBT with `let b = a.getTag("xxx")`, using `b` in a delayed callback such as `setTimeout` finds the data destroyed or crashes. Why?

This is a lifetime issue in the LSE NBT binding: the child NBT object returned by `getTag` holds only a raw pointer into the parent NBT's internal data and does not hold a reference to the parent (root) NBT. Once the parent object `a` is garbage collected, the data that child `b` points to is destroyed with it. To avoid this, keep the root NBT object alive in your script (for example in a global variable), or convert it to another form first (such as `toSNBT()`/`toObject()`), store that, and convert it back when needed with `NBT.parseSNBT` or similar.

*Applies to: all current versions (up to LSE 0.23.1)*
