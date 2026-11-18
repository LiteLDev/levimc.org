# LeviLamina mod API: commands

## How do I unregister commands registered by a LeviLamina mod when it is unloaded or disabled?

You do not need to, and you cannot unregister them manually. BDS commands cannot really be deleted, and LeviLamina provides no API to unregister commands; when a mod is disabled, LeviLamina automatically disables the command overloads that mod registered (they are restored when the mod is enabled again). After disabling, running the command on a client shows `Command version mismatch`, which is expected. In theory you could filter `AvailableCommandsPacket` so clients do not show the command, but LeviLamina itself does not modify packets.

*Applies to: LeviLamina 0.12 and later*

## How do I run a vanilla command (such as `tag`) in the background from a LeviLamina C++ mod, as the server or as a player, and optionally get the command output?

Option 1 (LeviLamina wrapper, output available): `#include "ll/api/command/CommandRegistrar.h"`, construct a `CommandOrigin` (such as `ServerCommandOrigin` or `PlayerCommandOrigin`), then call `CommandOutput out = ll::command::CommandRegistrar::getServerInstance().executeCommand("tag @a add foo", origin);`. Internally it runs `compileCommand` and then `run`, and the result is in `CommandOutput`.

Option 2 (call BDS directly, following LSE's `mc.runcmd` implementation):

```cpp
CommandContext context(cmd, std::make_unique<ServerCommandOrigin>("Server", ll::service::getLevel()->asServer(), CommandPermissionLevel::Owner, 0), static_cast<int>(CurrentCmdVersion::Latest));
ll::service::getMinecraft()->mCommands->executeCommand(context, false);  // the second argument is suppressOutput
```

To run as a player, use `std::make_unique<PlayerCommandOrigin>(level, player.getOrCreateUniqueID())` as the origin. The command string does not need a leading `/`. To capture the output, see LSE's `runcmdEx` (`compileCommand` + `command->run(origin, output)`). Related headers: `mc/world/Minecraft.h`, `mc/server/commands/MinecraftCommands.h`, `CommandContext.h`, `ServerCommandOrigin.h`, `PlayerCommandOrigin.h`, `CurrentCmdVersion.h`. Commands must run on the main thread.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## When registering a LeviLamina command, how do I declare optional parameters (such as coordinates `CommandPosition` / `CommandPositionFloat`, or strings), and how do I tell whether the player supplied one?

Wrap the field in the parameter struct with LeviLamina's `ll::command::Optional<T>` (header `ll/api/command/Optional.h`) and declare it in the overload with `.optional("fieldName")`. At execution time, use `params.xxx.has_value()` (or `if (params.xxx)`) to check whether it was supplied, and `.value()`/`.get()` to read it. For example:

```cpp
struct Params { std::string name; ll::command::Optional<CommandPositionFloat> pos; };
cmd.overload<Params>().required("name").optional("pos").execute(...);
```

Do not use `BlockPos` for coordinate parameters; use `CommandPosition` / `CommandPositionFloat`. To get the position, use `origin.getExecutePosition(version, params.pos.value())` (get the value out of the `Optional` first; `version` is the command version) (or `CommandPosition::getBlockPos(version, origin, offset)`) rather than reading the raw coordinates, otherwise the coordinates are wrong under `/execute`. If you need completely different parameter combinations, you can also register several overloads for the command (one with the parameter and one without).

*Applies to: LeviLamina 26.60.x*

## When developing a LeviLamina client mod, registering commands in `onEnable` as the documentation shows does not work. How do I register client and server commands?

Commands are either client commands or server commands: register server commands through `ll::command::CommandRegistrar::getInstance(false)` (or `getServerInstance()`), and client commands through `getInstance(true)` (or `getClientInstance()`, which exists only in client builds).

The client enables all mods as soon as the game finishes starting (when the main menu appears). There is no command registry yet at that point, so registering any command in `enable()` fails. The correct approach is:

1. Listen to `ll::event::ServerCommandRegisterEvent` and register server commands in the callback.
2. Listen to `ll::event::ClientCommandRegisterEvent` and register client commands in the callback.

On a server (BDS), mods are enabled after the world has loaded, so you can register directly in `enable()`, and only server commands can be registered on BDS. In a local world both kinds can be registered; in multiplayer only client commands can be registered.

*Applies to: LeviLamina client edition 26.60.x*

## Can a LeviLamina mod block/remove certain registered commands (such as vanilla `/me`, `/tell`, `/w`, `/msg`)?

LeviLamina provides no API to delete commands. Vanilla commands can be removed by hooking and intercepting their registration (`setup`); but do not try to remove commands registered by other mods, since forcing it easily crashes the server.

If the goal is only to stop players from spamming or crashing the server with target selectors (such as `/me @e`), you can use LeviAntiCheat's `disableSelector` setting to forbid players from using target selectors in commands.

*Applies to: LeviLamina current version (the hook approach depends on the BDS implementation). Not confirmed against the source code or the documentation: treat it as a pointer.*

## I want to replace/extend vanilla commands with LeviLamina (such as adding parameters to `stop`, `effect` or `tp`). Do I need to disable the vanilla command first? Will they conflict? Can LSE do it?

You do not need to disable the vanilla command (disabling the vanilla command's `setup` may instead break the command or even cause `std::terminate`). With LeviLamina's C++ command API, get the same-named command with `ll::command::CommandRegistrar::getInstance(false).getOrCreateCommand("stop", ...)` (or `getServerInstance()`), then add new overloads with `.overload<Params>()`; they coexist with the vanilla overloads without conflict. You can also register a new command and set aliases with `.alias(...)`. Note that you should not use `StopCommand::mServer` directly, because it may be a null pointer.

For LSE (JS plugins): the old NativeAPI has been removed, but the current LSE's `mc.newCommand` also goes through `getOrCreateCommand` internally. For an existing command name it prints `Runtime command ... already exists, changes will not be applied except for setOverload!`, meaning the description, permission and so on will not change, but you can still add runtime overloads to that command through `setOverload`.

*Applies to: LeviLamina current version*

## What command version should I use when registering/executing commands in a LeviLamina mod? What does `Command version not matched` mean?

When executing/compiling commands, use the current latest version `CurrentCmdVersion::Latest` (header `mc/server/commands/CurrentCmdVersion.h`); it is the default for the `version` parameter of `CommandRegistrar::executeCommand` / `compileCommand` (registering a command with `getOrCreateCommand` itself does not need a version). When you need the version in a command callback (such as `origin.getExecutePosition(version, pos)`), you can use the command instance's own version, `cmd.mVersion`; see the LeviLamina source `src/ll/core/command/Teleport.cpp` for how it is written.

Also, vanilla prints `Command version not matched` both for a wrong command version and for failing to match a correct overload, so seeing this message does not necessarily mean the version is wrong; the overload match may have failed. In the early days of adapting to BDS 26.32, some users hit this message on overloads registered by LL; if you run into it, upgrade to the latest LeviLamina first and then investigate.

*Applies to: LeviLamina 26.60.x*

## Must command names registered in BDS/LeviLamina be lowercase?

Yes, command names must be entirely lowercase English letters (a limitation of the BDS command system). LeviLamina's `CommandRegistrar::getOrCreateCommand` passes the name straight to BDS's `CommandRegistry` and does not convert the case for you; enum values, on the other hand, are automatically lowercased by LL.

## When registering a command in C++, what do the `CommandPermissionLevel` levels (`Any`/`GameDirectors`/`Admin`/`Host`/`Owner`/`Internal`, 0 to 5) mean? What level is an OP player?

The enum names follow vanilla Mojang:

- 0 `Any`: ordinary members.
- 1 `GameDirectors`: the level BDS gives OPs by default; command blocks are also at this level.
- 2 `Admin`: higher than 1, but almost no command in the game uses it.
- 3 `Host`: full OP, equivalent to the host of a single-player world (for example `/kick` needs level 3).
- 4 `Owner`: the console.
- 5 `Internal`: for internal use, essentially no different from 4.

Users report that a deopped player cannot use `GameDirectors`-level commands even in creative mode; an OP can use `GameDirectors` but not `Admin`/`Host`; the console cannot use `Internal`-level commands. In practice, 0/1/3/4 are the ones used. Adding `op-permission-level=4` to `server.properties` (note that the key name ends in `level`) raises the OP level so that OPs can use commands such as `/stop` in game.

*Applies to: current version (permission behavior depends on BDS). Not confirmed against the source code or the documentation: treat it as a pointer.*

## On the LL client, if a mod registers a command with the same name (such as `/fm`) on both the server and the client, which one wins when a player runs it? When should client commands be registered?

It depends on whether the command is a client command or a server command: a client command (`CommandRegistrar::getClientInstance()` / `getInstance(true)`) overrides a server command of the same name (a typical example is `help`).

The current version of LeviLamina has made command registration event-driven: register client commands in `ll::event::command::ClientCommandRegisterEvent` and server commands in `ServerCommandRegisterEvent` (LL's built-in `BuiltinCommands` does exactly this, calling `registrar.clear()` and then re-registering every time the event fires), so that commands are rebuilt correctly when you leave and re-enter a world or join another server. The old approaches (registering in `ClientJoinLevelEvent` or `onEnable`, or setting client side to `false` as a workaround) are no longer needed.

*Applies to: LeviLamina 26.10.0 and later (client build)*

## In a LeviLamina native command, how do I get the real coordinates from a position parameter? What is wrong with calling `CommandPosition::getPosition` directly?

Use `origin.getExecutePosition(cmd.mVersion, param.pos)` to get the `Vec3` coordinates directly (convert to `BlockPos` if you need integers); you do not have to handle relative-coordinate offsets yourself. `getExecutePosition` calls `CommandPosition::getPosition` internally, and the `CommandOrigin` of the `/execute` context overrides that function, so calling `getPosition` directly gives wrong coordinates under `/execute`. Pass `Command::mVersion` as the command version.

Note that the parameter type of `getExecutePosition` is currently `CommandPositionFloat const&`, so declare the coordinate field in your parameter struct as `CommandPositionFloat`. See `src/ll/core/command/Teleport.cpp` in the LeviLamina source for an example.

*Applies to: LeviLamina 0.11 and later*

## In a LeviLamina command overload, which type should a coordinate (`Vec3`) command parameter use?

Use `CommandPositionFloat` (or `CommandPosition`; `CommandPositionFloat` inherits from `CommandPosition`) in the parameter struct. Because `CommandOrigin::getExecutePosition` takes a `CommandPositionFloat`, `CommandPositionFloat` is recommended. Parameter type names follow Mojang's naming and have no common prefix; you can look up command parameter type names on the mcwiki, or see LeviLamina's `src/ll/core/command/Teleport.cpp`.

*Applies to: LeviLamina 0.11 and later*

## What do `.text()` and `.postfix()` do in LeviLamina command registration (`CommandRegistrar` / `overload`), and how do I use them?

`text` adds a fixed literal text (a keyword) to the command; for example `/aa bb cc` can be written as `cmd.overload().text("bb").text("cc").execute(...)`. It is not the same as a `std::string` parameter.

`postfix` adds a suffix to the parameter before it (it turns the previous parameter into a suffix parameter; vanilla only supports integer suffixes). For example, with `xp.overload<XP>().required("value")...` and `xp.overload<XP>().required("level").postfix("l")...`, `/xp 1` matches the first overload and `/xp 2l` matches the second.

*Applies to: LeviLamina 0.11 and later*

## In `command.overload().execute([](CommandOrigin const& origin, CommandOutput& output){...})` when registering a LeviLamina command, what are `origin` and `output`? Must the logger come from the entry class?

`origin` (`CommandOrigin`) is the source of the command execution; you can find out who ran the command through `getEntity()`, `getName()`, `getOriginType()` and so on. `output` (`CommandOutput`) returns the command result, for example `output.success("...")` / `output.error("...")` (fmt formatting is supported).

The logger does not have to come from the entry mod: `ll::io::Logger` cannot be constructed directly, but you can use `ll::io::LoggerRegistry::getInstance().getOrCreate("name")` to get a `std::shared_ptr<Logger>` to use globally. For logs only needed during development, use the `debug` level.

*Applies to: LeviLamina 1.x and later*

## When registering a LeviLamina command, do parameter enums have to be hard-coded one by one? How do I use enum values that can change dynamically (passing an array)?

Use a soft enum. The values of a soft enum can be added and removed at runtime; a typical example is the `objectives` parameter of the vanilla `scoreboard` command. In LL, register one with `ll::command::CommandRegistrar::getInstance(false).tryRegisterSoftEnum("name", {values...})`, then change it dynamically with `addSoftEnumValues` / `removeSoftEnumValues` / `setSoftEnumValues`. For the parameter type, use `ll::command::SoftEnum<T>` (`ll/api/command/SoftEnum.h`).

*Applies to: LeviLamina 1.x and later*

## Can a custom command registered with LeviLamina take different parameter types after the same command literal (such as a target selector or coordinates) and run different logic, like vanilla `/tp`?

Yes. After getting a `CommandHandle` through `CommandRegistrar::getOrCreateCommand`, call `overload<Params>()` several times to register multiple overloads; each overload has its own parameter list and `execute` callback.

Mind the matching priority between overloads: for example, if an overload with a `<string>` parameter and an overload with an `<enum>` parameter are registered at the same position, parsing always takes the string overload, so design overloads so that a string parameter does not swallow the other types.

*Applies to: LeviLamina 1.x and later*

## How do I make target selectors (`@a`, `@p` and so on) unable to select certain players (such as vanished players) in a LeviLamina mod?

Hook `CommandSelectorBase::newResults` (it returns `std::shared_ptr<std::vector<Actor*>>`) and filter out the players you do not want selected from the original result; target selectors then cannot select those players (such as vanished players).

*Applies to: LeviLamina 0.13.x and later (the function still exists in the current version)*

## Which types should I use for item, block, effect and similar parameters (the old LLSE `ParamType.Item/Block/Effect`) when registering a command in a native LeviLamina mod?

Don't follow the LL2 implementation. Look at the LeviLamina source file `src/ll/api/command/runtime/ParamKind.h`. The `ParamKind::Kind` enum lists every parameter type that runtime commands support, including `Item`, `BlockName`, `BlockState`, `Effect`, `ActorType`, `Actor`, `Player`, `BlockPos`, `Vec3`, `JsonValue` and `FilePath`. `ParamKindList` gives the matching C++ types (for example, `Effect` maps to `MobEffect const*`).

*Applies to: LeviLamina 0.11 and later*

## Using the mod's logger inside a LeviLamina command callback lambda fails to compile (`this` not captured / no matching overloaded function). How do I output messages from a command callback?

In a command callback, use the `CommandOutput` passed as a callback parameter (`output.success(...)` / `output.error(...)`, which support fmt formatting) to write to the command's executor instead of using the logger. If you do need the logger, don't capture `this`; get it inside the lambda through the mod singleton, for example `my_mod::MyMod::getInstance().getSelf().getLogger().info(...)`.

*Applies to: LeviLamina 0.11 and later*

## Where can I find example code for registering MC commands and other features when developing a LeviLamina mod?

Start with the developer guides in the official documentation. For command registration, see the "Command Guide" (`developer_guides/how_to_guides/command_guide`), which uses `CommandRegistrar::getInstance(false).getOrCreateCommand(...)` from `ll/api/command/CommandRegistrar.h`, followed by `command.overload<Params>().required(...).execute(...)`. There are also guides for events, forms, hooks, i18n and more, as well as the test code under `src-test` in the LeviLamina repository (such as `src-test/server/testCommand.cpp`). In addition, most LeviLamina mods are published on the lip package index, so you can pick a similar mod and open its source repository as a reference.

*Applies to: LeviLamina 1.x and later*

## When a mod registers a command alias, it can take over an alias of another mod (or even of a built-in LeviLamina command). Is this a bug?

Aliases are registered through `CommandHandle::alias()`, which calls BDS's `CommandRegistry::registerAlias` underneath. LeviLamina only uses `findCommand` to check whether the name is already a command: if it exists, the alias is silently skipped and not registered. Conflicts between two aliases depend on how the vanilla BDS `registerAlias` behaves (a later registration may overwrite an earlier one), and LeviLamina is not responsible for that. When writing a mod, avoid names that duplicate existing commands or aliases yourself.

*Applies to: current LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How can a command registered by a mod be hidden from players without operator permissions (so it doesn't appear in command completion)?

Give the command a higher permission level when registering it, for example `ll::command::CommandRegistrar::getInstance(false).getOrCreateCommand("mycmd", "description", CommandPermissionLevel::GameDirectors)` (or a higher level such as `Admin` or `Host`). Players without enough permission can neither see nor run the command. The default, `CommandPermissionLevel::Any`, means everyone can see it.

*Applies to: current LeviLamina version*

## After registering a custom command named `whitelist` with LeviLamina C++, it doesn't work or conflicts. Why?

The vanilla BDS `whitelist` command (an alias of `allowlist`) still exists and hasn't been removed, so a custom command with the same name conflicts with it; use a different command name. Also, the vanilla whitelist command is a level 4 (console) permission command.

*Applies to: LeviLamina server (BDS), depends on the vanilla BDS command table. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Adding an overload to a vanilla command (such as `gamemode`) with LeviLamina crashes or errors out. How do I add an overload to a vanilla command correctly? Is a runtime overload an overload that can be added at any time?

The problem is the registration timing: an overload must be added right after the command is registered (once a is registered and then b is registered, a can no longer be changed), otherwise the vanilla commands break. The correct approach is to hook the corresponding command's `setup` and add the overload after the original overloads have been registered (if `setup` is inlined, add it before the next command is registered instead). `runtimeOverload()` (`RuntimeOverload`) means an overload with no compile-time parameter type checking, whose parameters are described dynamically at runtime; it is not an overload that can be added at any time.

*Applies to: LeviLamina 1.x and later*

## How do I set the execute callback of a LeviLamina command overload? Does the `execute<fn>()` form still work?

No. Since 0.12, `execute<fn>()` (callback as a template argument) has become `execute(fn)` (callback as a normal argument); everything else is unchanged. For example:

```cpp
cmd.overload<Params>().required("name").execute([](CommandOrigin const& origin, CommandOutput& output, Params const& params) { ... });
```

*Applies to: LeviLamina 0.12 and later*
