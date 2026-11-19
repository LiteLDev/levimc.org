# LeviLamina

A lightweight, modular mod loader for Minecraft Bedrock Edition: for Bedrock Dedicated Server and the Windows client,
the successor to LiteLoaderBDS.

[![Discord](https://img.shields.io/discord/849252980430864384?style=for-the-badge&logo=discord)](https://discord.gg/v5R5P4vRZk)
[![Telegram](https://img.shields.io/badge/Telegram-blue?style=for-the-badge&logo=telegram)](https://t.me/LiteLoader)
[![656669024](https://img.shields.io/badge/656669024-red?style=for-the-badge&logo=qq)](https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=ndxRXO1HARA8ing7OunMClOz3cQTogL0&authKey=D7QTcqnzhBzuh3zc%2F70FjgklsVvkCImTjSRqHMwYGCLwIFpxzp%2FflC97Y7AUG%2Fpy&noverify=0&group_code=656669024)
[![937236109](https://img.shields.io/badge/937236109-red?style=for-the-badge&logo=qq)](https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=1u0nmmUIZOB716neFTlbyj_2aOQn_TV-&authKey=1lBqM20oOfdKjDnxkq09DjR729fqFfWVnaLQ7VjrDB%2FAg6qwvw6QCwdwYoRUrewU&noverify=0&group_code=937236109)
[![850517473](https://img.shields.io/badge/850517473-red?style=for-the-badge&logo=qq)](https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=3Fxt0gwMYkoLPani_vQ9tsNfYrnVy4hK&authKey=2A%2BNk3jmRaK%2FO1FBQSjTIbStAU1kbZWkjEkyh2RTVA015eTg6c4CvVhfByc1BtGZ&noverify=0&group_code=850517473)

## What LeviLamina is

LeviLamina is an unofficial mod loader for Minecraft Bedrock Edition. It loads into Bedrock Dedicated Server (BDS)
or into the Minecraft client on Windows, loads the mods you install, and gives them the API they are written
against. It is the successor to LiteLoaderBDS.

- **For server owners**, LeviLamina is the base every server mod builds on: install it into a server and add mods
  to it.
- **For players**, LeviLamina runs the client mods of a Minecraft installation on Windows.
- **For mod developers**, LeviLamina is the C++ API (`ll::` and the game's classes) your mod is built against,
  documented on this site and in the [C++ Reference](https://levimc.org/LeviLamina/api/).

What it gives a mod:

- **A comprehensive API**: commands, forms, configuration, events, hooks, services and more for mods written in C++
  ([the API by topic](api_reference/index.md)).
- **A powerful event system**: subscribe to what happens in the game, from players joining to blocks breaking
  ([events and hooks](concepts/events_and_hooks.md), [the event guide](developer_guides/how_to_guides/event_guide.md)).
- **Server and client**: the same API on Bedrock Dedicated Server and in the Minecraft client on Windows, with a
  few parts for one of them only ([supported versions](versions.md), [server and client builds](developer_guides/architecture.md#server-vs-client-builds)).

## A mod in a few lines

A LeviLamina mod is a DLL with a `manifest.json` in its own folder under `plugins/` (`mods/` on the client). Its
entry is a class registered with `LL_REGISTER_MOD`: LeviLamina calls `load()` when it loads the DLL and `enable()`
once the game has started. This one greets every player who joins:

```cpp
#include "ll/api/event/EventBus.h"
#include "ll/api/event/player/PlayerJoinEvent.h"
#include "ll/api/mod/NativeMod.h"
#include "ll/api/mod/RegisterHelper.h"
#include "mc/world/actor/player/Player.h"

class MyMod {
public:
    static MyMod& getInstance() {
        static MyMod instance;
        return instance;
    }

    bool load() { return true; }

    bool enable() {
        ll::event::EventBus::getInstance().emplaceListener<ll::event::PlayerJoinEvent>(
            [](ll::event::PlayerJoinEvent& event) {
                ll::mod::NativeMod::current()->getLogger().info("Welcome, {}!", event.self().getRealName());
            }
        );
        return true;
    }
};

LL_REGISTER_MOD(MyMod, MyMod::getInstance());
```

[Mod lifecycle](concepts/mod_lifecycle.md) explains when each of these runs, and
[Your first LeviLamina mod](https://levimc.org/tutorials/develop/first-levilamina-mod/) builds a mod like it from the
template, step by step.

## Where it fits

LeviLamina is the core of the LeviMC projects:

- [lip](https://levimc.org/lip/) runs a LeviLamina server and manages its packages: it sets up a server, installs
  LeviLamina into it, installs mods from the [mods catalog](https://levimc.org/mods/) and starts the server.
- [LegacyScriptEngine](https://levimc.org/LegacyScriptEngine/) is a LeviLamina mod that runs plugins written in
  JavaScript, Lua or Python, for when C++ is more than you need.
- [LeviLauncher](https://levimc.org/LeviLauncher/) is the launcher for the Minecraft client: it installs game
  versions, LeviLamina and client mods for you.

## Start here

New to LeviLamina? The tutorials take you from nothing to one thing done, step by step:

- [Your first server](https://levimc.org/tutorials/server/first-server/): install lip, set up a server with
  LeviLamina and start it.
- [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/): run LeviLamina and client mods
  with LeviLauncher.
- [Your first LeviLamina mod](https://levimc.org/tutorials/develop/first-levilamina-mod/): create a mod from the
  template, build it and load it.

[All tutorials](https://levimc.org/tutorials/)

## On this site

- **Guides**: how to use one part of the API, step by step: [events](developer_guides/how_to_guides/event_guide.md),
  [commands](developer_guides/how_to_guides/command_guide.md), [forms](developer_guides/how_to_guides/form_guide.md),
  [hooks](developer_guides/how_to_guides/hook_guide.md), [i18n](developer_guides/how_to_guides/i18n_guide.md),
  [coroutines](developer_guides/how_to_guides/coro_guide.md) and more.
- **Concepts**: how LeviLamina works: the [mod lifecycle](concepts/mod_lifecycle.md),
  [events and hooks](concepts/events_and_hooks.md) and the [architecture](developer_guides/architecture.md) of the
  project.
- **Reference**: the [C++ Reference](https://levimc.org/LeviLamina/api/) (every class and function, generated from
  the headers), [the API by topic](api_reference/index.md) with examples, the
  [Android native mods API](developer_guides/android/api/mod.md), the [supported versions](versions.md) and the
  [usage guidelines](common_guides/usage_guidelines.md).

Questions? The [LeviMC FAQ](https://levimc.org/faq/) answers what server owners ask (installing,
[error codes](https://levimc.org/faq/server/levilamina/errors/), crashes) and what
[mod developers](https://levimc.org/faq/develop/levilamina/basics/) ask.

LeviLamina is open source: see its [repository](https://github.com/LiteLDev/LeviLamina) and
[how to contribute](https://github.com/LiteLDev/LeviLamina/blob/main/CONTRIBUTING.md).

## Acknowledgements

Thanks to [Wuhan Rhymc Network Technology Co., Ltd.](https://www.rhymc.com/) for supporting this project  
[![Rhymc](https://www.rhymc.com/assets/img/logo.png)](https://www.rhymc.com/)
