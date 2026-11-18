# LeviAntiCheat

## Can I skip LeviAntiCheat's (LAC) built-in punishments and have my own plugin listen for cheat events and apply custom punishments? How do I use LeviPenalizeCheat, and is there an LSE version? What happens if I cancel the event?

Yes. LAC publishes `lac::punish::PlayerCheatEvent` (a cheat was detected; contains `mCheatType`, `mExtraData`, `mDuration` and `mType`), `lac::punish::PlayerBanWaveEvent` (BanWave kick/ban) and `lac::punish::SusClientEvent` (suspicious client) through LeviLamina's EventBus. All of them are cancellable events.

The official template <https://github.com/LiteLDev/LeviPenalizeCheat> is a LeviLamina C++ mod template (it ships the headers for these events). Use it like any C++ mod: subscribe with `ll::event::EventBus::getInstance().emplaceListener<lac::punish::PlayerCheatEvent>(...)` and implement your own punishment logic. There is no official LSE version; to use the events from a script, you have to write a C++ mod that forwards them (for example by exporting through RemoteCall to LSE).

About cancelling: LAC publishes `PlayerCheatEvent` before it writes the built-in log and applies the built-in punishment. If the event is cancelled, that cheat produces no log output, triggers no built-in punishment and adds nothing to the BanWave violation value. If you only want to listen without affecting the built-in punishment, do not cancel in your handler. If you want to take over punishment completely, you can also set `punish.enable` to `false` in `config.json`.

*Applies to: LeviAntiCheat 0.1.2 and later (still applies to the current v0.18.0)*

## Players are frequently rubber-banded and TPS drops while they move. Is LeviAntiCheat (LAC) the cause? How should I set server-authoritative-movement in server.properties when using LAC?

The rubber-banding comes from BDS's built-in server-authoritative movement validation, not from LAC. The current LAC has no movement (illegal movement) detection: in older LAC versions, `IllegalMovementCheck` only enabled BDS's built-in server movement validation, and it was removed in v0.15.0. So LAC does not require you to change any authoritative-movement setting in `server.properties`; leave it at the default.

Some users report that newer BDS (from about 1.21.70) forces authoritative movement on and it can no longer be turned off in `server.properties`. When server TPS is very low (below about 10), rubber-banding happens more often; investigate the cause of the lag first. If you really need to turn it off, the only way is a dedicated mod hook.

*Applies to: LeviAntiCheat 0.15.0 and later (current v0.18.0); the BDS behavior depends on the vanilla version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After setting online-mode=false in BDS (disabling licensed-account verification), player data and inventories keep getting lost and players join like new players. How do I fix this?

With licensed-account verification off, player data may no longer be read the way it was, so it looks like it was lost. LeviAntiCheat (LAC) has a built-in offline-mode inventory protection (it fixes inventory loss for offline-mode players). In `mods/LeviAntiCheat/config/config.json`, set `worldSafety.offlineInventoryProtection` to `true` (default `false`), then restart or run `/lac reload`. You can also write your own plugin to save player data.

*Applies to: Current LeviAntiCheat (v0.18.0)*

## What does it mean when LeviAntiCheat (LAC) reports that NoPacket was detected?

It means the player has not sent any packets for longer than a set time (packet-stop detection). The threshold is controlled by `movement.noPacketCheck.maxNoPacketTime` in `config.json` (default 12 seconds). If you get false positives, increase that value or turn the check off by setting `movement.noPacketCheck.enable` to `false`. For development and debugging you can also turn the check off, or handle it yourself by subscribing to `PlayerCheatEvent` (see LeviPenalizeCheat).

*Applies to: Current LeviAntiCheat (v0.18.0)*

## How do I use LeviAntiCheat's mute command? Typing mute directly doesn't work.

Muting is a subcommand of LAC's main command `lac`, not a standalone `mute` command. Use `/lac mute <player> [duration (minutes)]` to mute, `/lac unmute <player>` to unmute, and `/lac query <player>` to check a player's ban/mute status.

*Applies to: LeviAntiCheat 0.4.4 and later*

## The LeviAntiCheat log shows `"xxx" 已被检测到使用: Reach, current reach distance: 5.517 cheat level: 6` (meaning: detected using Reach) and the player is kicked by BanWave. What does it mean? Can I turn it off? Where are the records?

Reach means the attack distance is too long (reach hacks). `current reach distance` is the attack distance detected this time; `cheat level` is the player's accumulated count of over-distance hits (+1 for each over-distance hit, -1 for each normal attack). Only when it exceeds `detectLevel` (default 7) is it judged as Reach and this log printed. The player may be using a reach cheat, or high latency may cause a false positive.

The related settings are under `combat.reachDistanceCheck` in `mods/LeviAntiCheat/config/config.json`:

- `enable`: the switch;
- `reachDistance`: the maximum attack distance in non-creative mode, about 3.2 by default;
- `reachDistanceCreative`: the same for creative mode, about 5.3 by default;
- `detectLevel`: the detection threshold.

The violation value added for each Reach is in `punish.checkTypeViolationMap.Reach` (default 20). When the total reaches `punish.kickVL` (default 100), the player is kicked by BanWave; `punish.enableBanWave` turns BanWave off. Every LAC check can be switched on or off individually in the configuration.

LAC's dedicated log file is `./logs/LeviAntiCheat.log`, and console output is controlled by `consoleLog`. Older versions had a problem where the log file recorded nothing; it was fixed in 0.8.1.

*Applies to: Current LeviAntiCheat (v0.18.0); the reachDistance option exists since 0.4.4*

## What is LeviAntiCheat's GitHub address? What is the difference between LLAC and LAC?

Address: <https://github.com/LiteLDev/LeviAntiCheat>. You can install it with `lip install github.com/LiteLDev/LeviAntiCheat`. LLAC (LLAntiCheat) is the old anti-cheat from the LiteLoaderBDS (LL2) era, and its repository is archived. LAC (LeviAntiCheat) is the anti-cheat for LeviLamina and is still maintained.

## Is LeviAntiCheat (LAC) open source? Does its anti-X-ray work against X-ray resource packs and cheat clients?

LAC is closed source (the public repository only provides the README, configuration docs, language files and release packages) and does not accept direct code contributions.

Anti-X-ray works by having the server rewrite blocks when it sends sub-chunk data (modeled on PaperMC's Anti-Xray), so it does not matter whether the client uses a resource pack or a cheat client; the client cannot bypass it. The configuration is under `cheatPrevention.antiXray`, and each dimension can use one `engineMode`:

- `0`: replaces fully enclosed ores with stone/deepslate and similar blocks (hide mode);
- `1`: replaces hidden solid blocks at random with the fake ores from `obfuscateBlocks` (fake-ore mode);
- `2`: like `1`, but replaces uniformly per Y layer.

Note: ores exposed to air/water, and ores above `maxHeight`, may still be visible. Also keep `worldSafety.fakeSeed` enabled so ore positions cannot be derived from the seed.

*Applies to: LeviAntiCheat current version (anti-X-ray was rewritten in 0.16.0/0.17.2; current engineMode 0/1/2)*

## Can LeviAntiCheat (LAC) prevent item duplication exploits such as chunk-border duplication (chunk item duping)?

LAC currently has no fix for chunk-border duplication and does not block donkey duplication either. The duplication-related fixes it provides in `bugFixes` are:

- `uiItemDuplicateFix`: UI slot duplication;
- `fallingBlockCopyFix`: gravity blocks / sand duplicators, for example pointed-dripstone sand duplication;
- `bundleContainerIdentityFix`: duplication caused by a storage container's identity changing, related to bundles;
- `blockActorContainerMoveFix`: duplication by pushing container blocks with pistons.

For chunk duplication, you can first track down the duplicating players through behavior logs, or install a dedicated fix plugin.

*Applies to: LeviAntiCheat 0.17.5 and later (current 0.18.0)*

## I want to use LeviAntiCheat to fix the item duplication bug that uses the crafting table / UI slots, but I don't want to enable all of LAC's features. What should I do?

LAC has a built-in fix for UI slot duplication, controlled by `bugFixes.uiItemDuplicateFix` (default `true`). Every LAC feature can be turned off individually in `mods/LeviAntiCheat/config/config.json`: keep `bugFixes.uiItemDuplicateFix` as `true` and change the `enable` or boolean value of the checks you don't need to `false` (for example `cheatPrevention.antiXray.enable`, `movement.timerCheck.enable`, `combat.autoClickCheck.enable`, and so on; if you also don't want players to be kicked, you can set `punish.enable` to `false`). Change the values rather than deleting the options. After the change, run `/lac reload` or restart the server. Install: `lip install github.com/LiteLDev/LeviAntiCheat`

*Applies to: LeviAntiCheat current version (0.18.0, LeviLamina 26.60.\*)*

## How does LeviAntiCheat's anti-X-ray (AntiXray) work?

LAC's anti-X-ray is based on obfuscation (modeled on PaperMC's implementation). The server rewrites the chunk data it sends to the client: ores that are completely enclosed by solid blocks and that the player could not see anyway are replaced with fake blocks, so the client never receives the real blocks and X-ray resource packs stop working. It has three modes:

- `engineMode` 0: replaces the ores in `obfuscateBlocks` with `mainBlock` (default stone/deepslate);
- `engineMode` 1: replaces hidden solid blocks at random with blocks from `obfuscateBlocks`;
- `engineMode` 2: replaces uniformly per y layer.

The configuration is under `cheatPrevention.antiXray` in `config.json` and is set per dimension in `dimensions`; see `anti_x_ray.zh.md` in the repository for details. Ores exposed to air are not hidden. Also keep `worldSafety.fakeSeed` enabled; otherwise ore positions can be derived from the seed.

*Applies to: LeviAntiCheat current version (0.18.0)*

## LeviAntiCheat flags and kicks OPs/admins too. Is there an OP exemption? How do I make LAC ignore admins?

LAC does not distinguish OPs and treats everyone the same. This is normal behavior, and the configuration has no OP exemption option. What you can do:

1. Turn off the check that gives false positives individually in `config.json` (for example `movement.timerCheck`, `noPacketCheck`, or a check under `combat`);
2. Use the official template LeviPenalizeCheat (<https://github.com/LiteLDev/LeviPenalizeCheat>) to implement your own punishment logic that skips admins. You can also adjust thresholds such as `kickVL` under `punish`.

The old third-party plugin Lac-IgnoreOperator is archived and was last released in 2025-01; it is not recommended on newer versions.

*Applies to: LeviAntiCheat current version (0.18.0)*

## After setting LeviAntiCheat's anti-X-ray height too high (for example 256 for the Nether), players get stuck on terrain generation / the loading screen when entering the Nether. Can this "height" setting change the Nether's height?

No. The setting is `cheatPrevention.antiXray.dimensions.<dimension>.maxHeight`; it means only blocks below that y coordinate are obfuscated, that is, the maximum height at which anti-X-ray applies. It has nothing to do with the dimension's own height, and an anti-cheat plugin does not modify the game itself. `maxHeight` should be set within the dimension's height range (default 128 for the Nether) and must be a multiple of 16 (otherwise an error is logged and anti-X-ray is not enabled for that dimension).

According to the maintainers, when the obfuscation height is set beyond the dimension's height, the client does not accept the chunks the server sends and gets stuck on the loading screen; set it back to 128. Changing the Nether's height requires a separate dedicated plugin.

*Applies to: LeviAntiCheat current version (0.18.0)*

## How do I hide or fake the world seed from players on a LeviLamina server? Do I still need a separate FakeSeed plugin?

You do not need a separate plugin. LeviAntiCheat has a built-in fake seed feature (`worldSafety.fakeSeed`, enabled by default) that directly rewrites the seed the server sends to the client. Install it with `lip install github.com/LiteLDev/LeviAntiCheat`.

An addon cannot do this. Hiding the seed display in the settings screen with a resource pack only hides it from view; the client still receives the real seed. You can also change world generation with a behavior pack's feature rules and custom biomes, so that structure positions cannot be derived even if the seed is known.

*Applies to: LeviAntiCheat current version (0.18.0)*

## What do the fakeSeed options (enable, randomSeed, seed) in LeviAntiCheat's configuration file mean?

`fakeSeed` is under `worldSafety` in `config.json` and is used to send a fake seed to the client.

- `enable`: whether the fake seed is enabled;
- `randomSeed`: when `true`, a random fake seed is used and `seed` has no effect;
- `seed`: the fixed fake seed value sent when `randomSeed` is `false`.

Default values:

```json
"worldSafety": { "fakeSeed": { "enable": true, "randomSeed": false, "seed": 0 } }
```

With the fake seed enabled, you do not need to turn off client-side chunk generation (ClientSideChunkGen) manually; LAC handles it automatically.

*Applies to: LeviAntiCheat current version (0.18.0)*

## Which anti-cheat plugins can I use on a LeviLamina server? Is there a LeviLamina version of the old LLAC?

Yes: LiteLDev's official LeviAntiCheat (LAC), at <https://github.com/LiteLDev/LeviAntiCheat>. You can install it with lip: `lip install github.com/LiteLDev/LeviAntiCheat`, or download it from GitHub Releases. Make sure you pick the LAC version that matches your LeviLamina version (for example, LAC 0.18.0 depends on LeviLamina 26.60.*).

*Applies to: LeviLamina current version*

## Can I directly use an anti-cheat dll plugin written for LiteLoaderBDS (LL2) on a LeviLamina server?

No. Native plugins for LiteLoaderBDS (LL2) cannot run on LeviLamina. On LeviLamina, use the official anti-cheat LeviAntiCheat (LAC): <https://github.com/LiteLDev/LeviAntiCheat>. Install it with `lip install github.com/LiteLDev/LeviAntiCheat`, or download it from the Releases page (<https://github.com/LiteLDev/LeviAntiCheat/releases>). Note that the LAC version must match the LeviLamina version (for example, LAC v0.18.0 depends on LeviLamina 26.60.*).

*Applies to: All current LeviLamina versions*

## Why does Windows Defender / Windows Security / 360 flag LeviAntiCheat (LAC) as a virus or trojan and delete it? What should I do?

This is a false positive. LAC is a closed-source plugin; the maintainers say it is packed/code-protected (VMProtect) and its dll has no digital signature, so antivirus software easily misjudges such files as trojans. Download it only from the official GitHub Releases or through lip, add the server directory (or the `mods/LeviAntiCheat` directory) to the exclusion/trusted list of Windows Defender or your other antivirus, and then extract or install it again.

*Applies to: All current LeviAntiCheat versions (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## After enabling LeviAntiCheat's anti-X-ray, players report that the diamonds and other ores they mined turned into stone. Is this a bug?

It is not a bug. With `engineMode: 1` / `2` (the default configuration is 1), anti-X-ray replaces solid blocks that are completely surrounded by solid blocks with the fake ores from `obfuscateBlocks` before sending them to the client, to mislead X-ray users. When a block changes (mining starts, an explosion, and so on), the server resends the real surrounding blocks, so the fake ore then shows up as the real stone.

If players can see ores change right in front of them, you can increase `cheatPrevention.antiXray.dimensions.<dimension>.updateRadius` for that dimension (default 2), but the larger the range, the larger the area a client can see through.

*Applies to: LeviAntiCheat current version (configuration structure after the anti-X-ray rewrite in v0.17.2)*

## LeviAntiCheat's anti-X-ray (anti x-ray) seems to have no effect when enabled, or causes rubber-banding. How do I tune the parameters?

Adjust the parameters following the official documentation: <https://github.com/LiteLDev/LeviAntiCheat/blob/release/anti_x_ray.zh.md>. It explains each option under `cheatPrevention.antiXray` (`enable`, `maxThreads`, `autoSolidCheck`, `dimensions.<dimension>.engineMode`/`maxHeight`/`updateRadius`/`obfuscateBlocks`/`mainBlock`, and so on), gives recommended Overworld and Nether configurations for `engineMode` 0/1/2, and includes troubleshooting for common problems such as "ores are still visible" and "it does not work below y=0".

*Applies to: LeviAntiCheat current version*

## Is there a plugin that can detect banned items such as 32k items (illegal enchantments, bedrock, portal blocks, spawners, spawn eggs, blocks with special values, and so on)?

You can use LiteLDev's official anti-cheat LeviAntiCheat (LAC). In `inventoryManagement.banItem.blacklist` in `mods/LeviAntiCheat/config/config.json`, enter the namespaced IDs of the items to ban (such as `"minecraft:bedrock"`). For over-level enchantments, turn on `inventoryManagement.enchantCheck` (off by default) and set each enchantment's maximum level in `maxEnchantLevel`. There are also checks such as `anvilEnchantLimits` (anvil enchantment check), `invalidItemDetection`, `invalidStackDetection` and `antiInvalidNbtItem`.

*Applies to: LeviAntiCheat current version (config version 21)*

## Why does LeviAntiCheat's banned/illegal item detection not report end portal frames a player already has? How do I ban certain items?

With LAC installed, players cannot obtain such items; they are blocked and a message is shown in the console. Items that are not reported are usually leftovers that already existed before installation.

To ban items, enter their namespaced IDs in `inventoryManagement.banItem.blacklist` (a string array) in `mods/LeviAntiCheat/config/config.json`, for example `"blacklist": ["minecraft:bedrock", "minecraft:end_portal_frame"]`, and keep `banItem.enable` as `true`. A hit triggers the BanItem check and adds a violation value according to `punish.checkTypeViolationMap.BanItem`. LAC is by design not responsible for removing items; if you need to remove them, listen to `lac::punish::PlayerCheatEvent` (see the LeviPenalizeCheat template) and handle it yourself.

*Applies to: LeviAntiCheat current version (config version 21)*

## Does the banItem (banned item list) in LeviAntiCheat's (LAC) configuration support regular expressions?

No. `inventoryManagement.banItem.blacklist` accepts only specific namespaced item IDs (such as `"minecraft:bedrock"`); regular expressions or wildcards cannot be used.

*Applies to: LeviAntiCheat current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## LeviAntiCheat's enchantment check kicks players by mistake (for example, the anvil enchantment check triggers when taking off armor) or cannot be turned off. What should I do?

LAC has two independent enchantment checks: `inventoryManagement.enchantCheck` (enchantment level check, off by default) and `inventoryManagement.anvilEnchantLimits` (anvil enchantment check, on by default). Turning off only `enchantCheck.enable` is not enough; you also need to set `"anvilEnchantLimits": false` to turn off all enchantment-related checks completely. After the change, run `/lac reload` or restart. You can also just lower the violation values of `InvalidAnvilEnchant` / `InvalidEnchantLevel` in `punish.checkTypeViolationMap` to avoid kicks. The false positives when taking off armor in early versions such as 0.4.0-rc6 were fixed in rc.6 to rc.8, so use the latest version.

*Applies to: LeviAntiCheat current version (config version 21)*

## I downloaded LeviAntiCheat (LAC, with anti-X-ray) and put it in the server, but it does not load, shows no message, and I cannot find a config file. How should I install it?

The recommended way is to install with lip: `lip install github.com/LiteLDev/LeviAntiCheat`. lip puts it in the right place and matches the LeviLamina version automatically.

For a manual install, download `LeviAntiCheat-windows-x64.zip` from the GitHub Release and put the whole `LeviAntiCheat/` folder from the archive (containing `manifest.json` and the dll) under the server's `mods/`, so that it ends up at `mods/LeviAntiCheat/`. Do not put only the dll there, and do not add an extra folder level. If you only see description files such as the manifest and no config file, the plugin was not loaded correctly; once it loads correctly, `mods/LeviAntiCheat/config/config.json` is generated.

Also make sure the LAC version you downloaded matches your LeviLamina version (for example, LAC 0.18.0 depends on LeviLamina 26.60.*); old versions (such as 0.2.x, made for LiteLoaderBDS/old LL) will not load. Adjust the anti-X-ray feature in `cheatPrevention.antiXray` in the configuration.

*Applies to: LeviLamina current version (LAC 0.18.0 / LeviLamina 26.60.\*)*

## I installed LeviAntiCheat but cannot find its configuration file. Where is it?

The configuration file is generated automatically only after you have started the server once (with the plugin loaded successfully). It is at `mods/LeviAntiCheat/config/config.json`. After editing, restart the server or use `/lac reload` to reload the configuration.

*Applies to: LeviAntiCheat current version (0.18.0)*

## Uninstalling LeviAntiCheat with lip inside a docker container fails. How do I uninstall it?

`lip uninstall` is a command-line operation and is not refused just because the server is running. However, if a file to be deleted is in use by the running server (on Windows, `LeviAntiCheat.dll` loaded by BDS), the operation fails and rolls back entirely. In that case, stop the server first and then run `lip uninstall github.com/LiteLDev/LeviAntiCheat` (the lip graphical interface refuses to uninstall outright while the server is running).

In the current official docker images, the container's main process is `lip run`, so stopping the server makes the container exit, and you cannot "stop the server and then enter the container". Instead, run this while the container is running:

```shell
docker exec -it <container-name> lip uninstall github.com/LiteLDev/LeviAntiCheat
```

This is the same way the official tutorial adds mods with `docker exec ... lip install`. Then run `docker stop` and start the container again for the change to take effect.

In the Wine image, lip runs natively on Linux and usually does not hit file locks. If it fails because of a file lock in a Windows container image, stop the container, start a temporary container on the same data volume and change the entrypoint to run the lip uninstall. Also, if the package was installed through the `PACKAGES` variable, that variable only takes effect on the first start; removing it does not uninstall packages that are already installed.

*Applies to: lip current version (v0.41.x), docker-levilamina-server current images (latest-wine / latest-windows)*

## LeviAntiCheat worked at first (or was installed with lip), but later startup reports a load error and LeviAntiCheat.dll is gone. What is the cause?

This is usually not a problem with lip or the plugin itself: Windows Defender (Windows Security) quarantined/deleted `LeviAntiCheat.dll` as a threat (LAC is closed source and protected, so it is easily flagged by mistake). Restore the file from "Protection history" in Windows Security, add the server directory to the exclusions, and then reinstall the plugin (for example `lip install github.com/LiteLDev/LeviAntiCheat`).

*Applies to: LeviLamina servers running on Windows, all current versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What value should LeviAntiCheat's anti-X-ray (`antiXray`) `engineMode` use? How do the modes differ, which is cheapest, and does it modify the world?

The current values are `0`/`1`/`2` (not the old `1`/`2`/`3`; PaperMC modes 1/2/3 in old docs and images correspond to 0/1/2 here). Set it per dimension in `cheatPrevention.antiXray.dimensions.<dimension>.engineMode`:

- `engineMode: 0`: replaces ores listed in `obfuscateBlocks` with a fake block (`mainBlock`, default `minecraft:stone`; below y=0 it uses `mainBlockMinus`, default `minecraft:deepslate`). It only hides ores completely enclosed by solid blocks; ores exposed to air or water are not hidden. It has the lowest computational cost.
- `engineMode: 1`: randomly replaces enclosed solid blocks with blocks from `obfuscateBlocks`. This hides more effectively against X-ray, but sends more data.
- `engineMode: 2`: similar to 1, but every block in the same y layer is replaced with the same fake block, which makes subchunks more regular and compresses better in packets.

Chunk rewriting runs on worker threads (`maxThreads`; 0 means use the number of CPU threads), so the main thread is barely affected. Anti-X-ray only rewrites the packets sent to clients and does not modify the world. Only blocks below `maxHeight` (must be a multiple of 16) are obfuscated, and real blocks are resent within `updateRadius` when blocks change. Keep `worldSafety.fakeSeed` enabled as well to prevent seed reverse-engineering. You can also disable LAC's anti-X-ray and use the standalone GlacieTeam/AntiXray instead. Their options mostly correspond (AntiXray uses snake_case, LAC uses camelCase), but check yourself whether its version supports the current LeviLamina.

*Applies to: LeviAntiCheat 0.16.0 and later (current 0.18.0)*

## The server crashes after installing LeviAntiCheat (LAC) on a LeviLamina server (crash on startup or while running). What is the cause, and how do I fix it?

First confirm that the LAC version matches the LeviLamina version: each LAC version supports only specific LeviLamina versions (for example, a user installed a LAC built for LeviLamina 1.2 on 1.1 and the server crashed on startup). Download the LAC version that matches your LeviLamina, or upgrade LeviLamina to the version LAC requires. Installing with `lip install github.com/LiteLDev/LeviAntiCheat` is recommended, because lip checks versions against dependencies.

If it still crashes while running after the versions match, set `cheatPrevention.antiXray.enable` to `false` in `mods/LeviAntiCheat/config/config.json` to narrow it down (anti-X-ray has historically been a common source of LAC crashes), and file an issue with the maintainers. If you do not need features such as anti-X-ray, you can also skip LAC; LeviLamina's own vulnerability fixes (`vulnerabilityFixes`) do not depend on LAC.

*Applies to: All current versions (latest LAC v0.18.0 corresponds to LeviLamina 26.60.\*)*

## After installing LeviAntiCheat (LAC), blocks in the overworld display incorrectly. How do I fix it?

This is usually caused by LAC's anti-X-ray feature (it obfuscates blocks fully enclosed by solid blocks; with the default `engineMode` of 1, these hidden solid blocks are randomly replaced with ores from `obfuscateBlocks` before being sent to the client). In `mods/LeviAntiCheat/config/config.json`, set `cheatPrevention.antiXray.dimensions.overworld.enable` to `false` to turn off anti-X-ray in the overworld (or set `cheatPrevention.antiXray.enable` to `false` to turn it off everywhere), then run `/lac reload` or restart the server. If the display problem is with addon blocks, also check settings such as `treatAddonBlocksAsNonSolid` and `nonSolidBlocks`.

*Applies to: All current versions (config keys as of LAC 0.17.x/0.18.0)*

## After installing LeviAntiCheat (LAC), startup reports a version-related error and it cannot load. What should I do?

LAC is compiled for specific LeviLamina versions, so the versions must match. Install the LAC that matches your current LeviLamina version (or upgrade both to matching versions). Installing with lip is recommended so dependencies are resolved automatically: `lip install github.com/LiteLDev/LeviAntiCheat`. For example, the current latest LAC 0.18.0 requires LeviLamina 26.60.*; the CHANGELOG lists which LL version each LAC version corresponds to.

*Applies to: All current versions (LAC 0.18.0 corresponds to LeviLamina 26.60.\*)*

## Can LeviAntiCheat (LAC) be installed together with the Fishing anti-cheat (FAC)?

At the time, the maintainers said they are incompatible: FAC breaks one of LeviLamina's APIs, so you can only choose one of the two.

*Applies to: April 2024, LeviLamina 0.x era; current version unknown. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What does the ban duration (`duration`) field in LeviAntiCheat (LAC) punishment settings mean?

It is the duration of the punishment (ban), not a count of cheating incidents. In the current config it corresponds to `punish.banDuration`, in seconds; `0` means a permanent ban. Whether a player is banned is decided by `punish.banVL` (`-1` means no ban), and `kickVL` is the violation level for kicking. The manual command `/lac ban <player> [reason] [duration (minutes)]` takes its duration in minutes.

*Applies to: current version (LeviAntiCheat 0.18.0, config version 21)*

## LeviAntiCheat reports 「已被检测到使用: InvalidFilterString, string size: ...」 (detected using: InvalidFilterString, string size: ...) and kicks a player through BanWave, but the player only renamed an item with an anvil and a name tag using vanilla `§` color codes. What is going on?

This is LAC's item name length check (violation type `InvalidFilterString`): the item name string is longer than the configured limit. The `string size` in the log matches the UTF-8 byte count of the name, and `§` format codes and Chinese characters each take several bytes, so a name that looks short can still exceed the limit. In `mods/LeviAntiCheat/config/config.json`, increase `playerInteractions.itemNameLengthCheck.maxStringLength` (default 90), or set `itemNameLengthCheck.enable` to `false` to turn the check off. You can also lower the violation value of `punish.checkTypeViolationMap.InvalidFilterString` (default 50); `punish.enableBanWave` controls ban waves. Run `/lac reload` after changing the config.

*Applies to: current version (LeviAntiCheat 0.18.0)*

## After editing LeviAntiCheat's `config.json`, the log shows errors (such as AntiXray block configuration errors). What should I do?

Most likely a required entry was deleted, a block name is wrong, or the JSON is malformed. Back up and delete `mods/LeviAntiCheat/config/config.json`, restart the server so it generates the default config, then redo your edits as needed. If AntiXray's dimension name, `engineMode` or `maxHeight` (must be a multiple of 16) is wrong, the log reports an error and anti-X-ray is not enabled for that dimension.

*Applies to: current version (config path `mods/LeviAntiCheat/config/config.json`). Not confirmed against the source code or the documentation: treat it as a pointer.*

## LeviAntiCheat's Timer (packet rate) check falsely flags normal players and kicks them even when standing still, with `rate` around 25-30 in the log. What should I do?

A normal client sends movement input packets at the tick rate, about 20 per second (fluctuating around 18-22), and LAC's default threshold is 24. Network jitter can cause false positives. In the config, raise `movement.timerCheck.maxPacketSpeed` to around 30 (you can also adjust `detectLevel`, default 15, or lower the `punish.checkTypeViolationMap.Timer` violation value), then run `/lac reload`.

*Applies to: current version (LeviAntiCheat 0.18.0)*

## Does LeviAntiCheat's anti-X-ray support custom dimensions created by MoreDimensions?

Anti-X-ray is configured per dimension, keyed by dimension name under `cheatPrevention.antiXray.dimensions` (by default only `overworld` and `nether`). The maintainers say that for a custom dimension you need to add a configuration with its dimension name there yourself. If the dimension name is not recognized, the log reports an error and anti-X-ray is not enabled for that dimension, so check the log accordingly.

*Applies to: current version (AntiXray was rewritten in 0.16.0/0.17.2). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is there Chinese documentation or a tutorial for LeviAntiCheat's configuration file?

Yes. The repository has a Chinese README: <https://github.com/LiteLDev/LeviAntiCheat/blob/release/README.zh.md>, which gives the full default configuration with Chinese comments (the config file is at `mods/LeviAntiCheat/config/config.json`). The anti-X-ray submodule has its own documentation, `anti_x_ray.zh.md`. Note that the `"version"` field in the config file is the config version number; do not edit it by hand (currently 21).

*Applies to: LeviAntiCheat current version (0.18.0)*

## LeviAntiCheat (LAC) often wrongly bans or kicks normal players. How do I reduce false positives or turn off some checks (for example, keep only anti-X-ray)?

Edit `mods/LeviAntiCheat/config/config.json` (run `/lac reload` or restart the server afterwards), and set `enable` to `false` for checks that produce false positives, or loosen their thresholds:

- Speed hack (timer) check, a common source of wrongful bans: `movement.timerCheck.enable`, or raise `maxPacketSpeed` (maximum movement input packets per second, default 24);
- No-packet check: `movement.noPacketCheck.enable`, or raise `maxNoPacketTime`;
- Auto-clicker and attack reach: `combat.autoClickCheck`, `combat.reachDistanceCheck`;
- Item-related checks: `invalidItemDetection`, `invalidStackDetection`, `antiInvalidNbtItem`, `anvilEnchantLimits`, `banItem` and others under `inventoryManagement`;
- Punishment: `punish.enable` (master switch), `punish.enableBanWave` (ban waves), `kickVL` / `banVL` (violation levels for kicking/banning), and the violation value each check adds per detection in `punish.checkTypeViolationMap`; lower a check's value to reduce wrongful kicks.

If you only want anti-X-ray, keep `cheatPrevention.antiXray.enable=true` and turn the other checks off. See <https://github.com/LiteLDev/LeviAntiCheat/blob/release/README.zh.md> for what each option means.

Note: LAC removed `IllegalMovementCheck` in 0.15.0. Movement validation such as being pulled back while walking comes from vanilla BDS server-authoritative movement and can no longer be adjusted through LAC.

*Applies to: LeviAntiCheat 0.15.0 and later (current 0.18.0)*

## After installing LeviAntiCheat (LAC), players take fall damage when jumping or running on flat ground (TPS and latency are normal). How do I fix it?

This is caused by LAC's "remove client authority over player actions" feature. In `mods/LeviAntiCheat/config/config.json`, set `movement.disablePlayerActionsAuthority` to `false` (it defaults to `false` since 0.17.4; in 0.17.3 the feature is named `PlayerActionsAuthority` and is on by default, so upgrading to the latest version is recommended).

*Applies to: LeviAntiCheat 0.17.3 and later (in current 0.18.0 the key is `disablePlayerActionsAuthority`)*

## After installing LeviAntiCheat (LAC), the server console keeps kicking players, even all players, so nobody can join. How do I fix it?

This is usually a false positive from LAC's no-packet check (NoPacket). That check looks for players who stop sending packets to the server for a long time; turning it off does not make cheaters "invincible". In `mods/LeviAntiCheat/config/config.json`, set `movement.noPacketCheck.enable` to `false`, or raise `movement.noPacketCheck.maxNoPacketTime` (default 12 seconds). Also, 0.4.5 fixed NoPacket false positives when the server main thread lags, so first make sure you are on the latest LAC.

*Applies to: LeviAntiCheat current version (0.18.0)*

## Some plugins that change player name display by sending packets conflict with LeviAntiCheat's fake-name check. What should I do?

In `mods/LeviAntiCheat/config/config.json`, set `cheatPrevention.antiFakeName` to `false` (it is `false` by default in the current version).

*Applies to: LeviAntiCheat current version (0.18.0)*

## After installing LeviAntiCheat, players get kicked for typing commands like `shop` repeatedly. What should I do?

This is triggered by the command spam check (`CommandSpam`, meant to stop cheats such as Horion that send many commands per second). In `mods/LeviAntiCheat/config/config.json`, raise `playerInteractions.antiSpam.maxCmdRate` (maximum commands per second, default 2), or lower `punish.checkTypeViolationMap.CommandSpam` (violation value added per trigger, default 50).

*Applies to: LeviAntiCheat current version (0.18.0)*

## After installing LeviAntiCheat (LAC), some players can still spam and I cannot stop them. What should I do?

Adjust the `playerInteractions.antiSpam` settings in `mods/LeviAntiCheat/config/config.json`: make sure `enable` is `true`, lower `maxChatRate` (maximum chat messages within `chatRateDuration` seconds; the default is 5 messages in 10 seconds), `maxCmdRate` (maximum commands per second) and `maxChatLength` (maximum chat length), and enable `disableSelector` to forbid target selectors in commands. You can also raise the violation values of `Spam` / `CommandSpam` / `MessageTooLong` in `punish.checkTypeViolationMap` so spammers are kicked sooner.

*Applies to: LeviAntiCheat current version (0.18.0)*
