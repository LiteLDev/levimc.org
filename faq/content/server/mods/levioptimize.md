# LeviOptimize

## My LeviLamina server has low TPS. Does LeviOptimize have a profiling command like timings/spark? How do I track down lag?

The new LeviOptimize (since 0.17.1) provides `/lo profile` (requires the GameDirectors permission; works from the console), which shows the current and average full-frame MSPT/TPS (the last 20 samples) from the `full_frame_timing` diagnostics. Note that it only gives overall MSPT/TPS and no longer breaks down the time by system or plugin like the old `timing` command. The same command also offers `/lo list`, `/lo reload`, `/lo enable <feature>`, `/lo disable <feature>` and more, so you can toggle a single optimization to compare the effect. How to track down lag: common causes are loading lots of new chunks (players flying fast with elytra or boats; this recovers after the chunks unload, and you can teleport the players back to the main town), too many entities, high-frequency redstone, poorly performing addons, and lag machines. You can back up the world locally and open the suspicious chunks to inspect them, use tools such as Amulet to delete or reset chunks if necessary, or compare with a new world to rule out plugin, addon or world problems. If you need a per-plugin time breakdown, consider third-party plugins such as CoralFans.

*Applies to: LeviOptimize 0.17.1 and later; LeviLamina 26.60.x*

## Can LeviOptimize (which has ported Endstone optimizations since 0.17.1) fix client-side rendering lag?

No. LeviOptimize only optimizes server-side logic (chunk publishing, entity broadcasting, redstone, random ticks, etc.) and does not touch client rendering. All current optimization features are marked as server features in the source (`FeatureSide::server`); the client build's `/clilo` command can only manage client-side features, and reports `not available on this side` for these server-side optimizations.

*Applies to: LeviOptimize 0.17.1 and later*

## Chunks stay loaded after players leave (chunk leak). Do I need ChunkLeakFix on a LeviLamina server?

No. ChunkLeakFix (`dreamguxiang/ChunkLeakFix`, `ES-ChunkLeakFix`) is for Endstone; LeviOptimize includes this fix itself. Its config key is `chunk_leak_fix` (enabled by default), and it removes leftover state such as the player's map tracker when the player disconnects. You can verify it with machines that depend on chunk unloading, such as sand farms.

*Applies to: LeviOptimize 0.18.0; LeviLamina 26.60.x*

## After installing or updating LeviOptimize with lip, the server still reports a wrong version or a loading error, or lip fails to download it. What do I do?

This is usually because lip did not actually download or update the package (for example, the network blocks GitHub). Install manually instead: download the matching version from <https://github.com/LiteLDev/LeviOptimize/releases>, extract `LeviOptimize-server-windows-x64.zip` for a server (`LeviOptimize-client-windows-x64.zip` for a client), and copy the `LeviOptimize` folder from it into `mods/`. Note that the version must match LeviLamina (the current 0.18.0 requires LeviLamina 26.60.x).

## Technical-Minecraft players build large piglin farms, bone meal machines and similar machines, and the BDS TPS is very low. How can I optimize this?

You can install LeviOptimize, whose `push_entity_opt` can limit entity pushing: by default it only discards zero-vector pushes, and you must change `max_push_times` from the default `-1` (unlimited) to a positive number to limit the number of pushes per tick. You can also throttle redstone with a plugin such as RedstoneLimiter, limit the number of entities (have players build fewer machines or share them), and modify the entity definitions to disable collisions for mobs such as villagers to reduce overhead. Detecting high-frequency redstone itself costs performance, so throttling it is better than detecting it and then breaking it. Third-party plugins and vanilla behavior have not been verified.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## BDS gets slower and slower after installing large addons (such as AlylicasDungeons or Better on Bedrock). Would a faster CPU or LeviOptimize fix it?

The lag mainly comes from the poor performance of the addons (script API) themselves, so adding hardware helps little. LeviOptimize only optimizes some native logic such as chunks, entity broadcasting, redstone and random ticks. Mojang's addons and script API are outside its scope, so installing it won't fix the problem; the only option is to use fewer addons.

## My LeviLamina server lags when many players are online. How do I install and configure the optimization plugin LeviOptimize?

Install it with lip: `lip install github.com/LiteLDev/LeviOptimize` (current version 0.18.0, requires LeviLamina 26.60.x). The first launch generates `mods/LeviOptimize/config/config.json`, and all optimizations are enabled by default. You can disable or adjust them as needed under `features` (for example the sub-options of `push_entity_opt`); after editing, run `/lo reload` to apply the changes without a restart, or use `/lo enable <feature>` / `/lo disable <feature>` to toggle a feature and save it directly.

*Applies to: LeviOptimize 0.17.1 and later*

## How can I optimize the performance of a BDS server?

You can install LiteLDev's performance mod LeviOptimize (GitHub: `LiteLDev/LeviOptimize`) with lip: `lip install github.com/LiteLDev/LeviOptimize`, or download `LeviOptimize-server-windows-x64.zip` from Releases and extract it into `mods/`. It optimizes hot spots such as chunk sending, entity broadcasting, redstone updates, the locator bar, random ticks and async worker scheduling. Each feature can be toggled individually in `mods/LeviOptimize/config/config.json`, or at runtime with `/lo enable|disable <feature>`. LeviOptimize must match the LeviLamina version (the current v0.18.0 corresponds to LeviLamina 26.60.x). Also, BDS mostly depends on single-core performance, so when choosing a server, prefer a CPU with a high clock speed and strong single-core performance; many cores help little.

*Applies to: LeviOptimize v0.18.0; LeviLamina 26.60.x*

## Is there a plugin that can raise the TPS of a LeviLamina server? What is the difference between LeviOptimize and levilamina-loc?

You can use LeviOptimize (LO for short, <https://github.com/LiteLDev/LeviOptimize>), a performance mod for LeviLamina that optimizes the vanilla hot paths behind low TPS. Install it with `lip install github.com/LiteLDev/LeviOptimize`. levilamina-loc (<https://github.com/LiteLDev/levilamina-loc>) is LeviLamina's language pack (localization); it is installed automatically as a dependency when you install LeviLamina with lip and has nothing to do with performance optimization, so don't confuse the two.

## Chunks and entities are not unloaded after players leave (the entity count balloons and causes lag). Can LeviOptimize still fix this on 26.x versions?

Yes. LeviOptimize is still maintained (not archived), and the latest v0.18.0 supports LeviLamina 26.60.x. Its `chunk_leak_fix` (source `src/lo/features/ChunkLeakFix.cpp`) uses the vanilla cleanup logic to remove the player's map trackers, decorations and dirty state when the player disconnects, so the map data doesn't keep tracking and holding the entities of an offline player (source comment: `so the map does not keep the player's entities alive`). Since v0.17.1, LeviOptimize has been rewritten on a new framework and has ported a number of Endstone optimizations. The configuration is in the `features` section of `mods/LeviOptimize/config/config.json`, with snake_case keys (such as `"chunk_leak_fix": true`), and all features are enabled by default. If you run into crashes, use `/lo list` to see the feature status, and use `/lo disable <feature>` to turn off the other features one by one, keeping only `chunk_leak_fix`, to narrow it down; `/lo reload` applies config changes without a restart.

*Applies to: LeviOptimize 0.17.1 and later; LeviLamina 26.60.x*

## How do I check the TPS of a LeviLamina server (LSE has no TPS API)?

Install LeviOptimize (`lip install github.com/LiteLDev/LeviOptimize`), then run `/lo profile`. It prints the current and average full-frame MSPT and the corresponding TPS from the `full_frame_timing` diagnostics (the last 20 samples). The command requires the GameDirectors permission (OP) and can be run from the server console. Make sure `diagnostics.full_frame_timing` and `commands.server_feature_manage_command` in `config.json` are `true` (the default).

*Applies to: LeviOptimize 0.17.1 and later; LeviLamina 26.60.x*

## How do I view or test the performance of a LeviLamina server in a straightforward way? Does LeviLamina itself include optimizations?

LeviLamina itself is only a loader and mod framework and does not provide performance optimizations. You can install LeviOptimize: use `/lo profile` to see the current and average full-frame MSPT and TPS; use `/lo list` to see the status of each optimization feature, and use `/lo enable <feature>` / `/lo disable <feature>` to toggle a single optimization at runtime (the change is written back to `mods/LeviOptimize/config/config.json`). Compare the `/lo profile` numbers before and after toggling to evaluate the effect. Note that the new version no longer provides a per-module time breakdown (such as `LevelChunkTicking`).

*Applies to: LeviOptimize 0.17.1 and later; LeviLamina 26.60.x*
