# Your first script plugin

At the end of this tutorial your server runs a plugin you wrote in JavaScript. It greets every player who joins, shows them a welcome toast, drops a diamond at their feet, and adds a console command. The plugin runs on LegacyScriptEngine (LSE), which lets you write LeviLamina plugins in JavaScript, Lua or Python instead of C++: no compiler, no build, just a text file and a restart.

It takes about twenty minutes.

## What you need

- A server with LeviLamina, set up with `lip`: [Your first server](../server/first-server.md). This tutorial uses `D:\servers\survival`.
- A text editor. [Visual Studio Code](https://code.visualstudio.com/) is a good choice; any editor that saves plain text works.
- Minecraft Bedrock on any device that can reach the server, to see the greeting in the game. Without it you can still do steps 1 to 4.

You do not need to know JavaScript well: the code is short and explained line by line. If you have never written any, the [JavaScript guide on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) covers the basics.

## 1. Install the JavaScript engine

LSE comes as one package per language, called a **variant**. This tutorial uses `#quickjs`, the JavaScript engine.

1. Stop the server if it runs.
2. In the server folder, install the variant:

   ```shell
   cd D:\servers\survival
   lip install github.com/LiteLDev/LegacyScriptEngine#quickjs
   ```

3. Run `lip list`. You should see `github.com/LiteLDev/LegacyScriptEngine#quickjs` with its version, and its dependencies below.

You can also install it from the **Get mods** page of `lip`, as shown in [Install mods on your server](../server/install-mods.md).

## 2. Create the plugin folder

A plugin is a folder in `mods` with a script and a `manifest.json`, just like a C++ mod.

1. Create the folder `D:\servers\survival\mods\MyPlugin`.
2. In it, create `manifest.json` with this content:

   ```json
   {
       "entry": "main.js",
       "name": "MyPlugin",
       "type": "lse-quickjs",
       "dependencies": [
           {
               "name": "legacy-script-engine-quickjs"
           }
       ]
   }
   ```

   - `entry` is the script that runs.
   - `name` is the name of your plugin. Keep it the same as the folder.
   - `type` says which engine runs it: `lse-quickjs` for JavaScript. The other engines are `lse-lua`, `lse-nodejs` and `lse-python`.
   - `dependencies` makes LeviLamina load the engine first.

3. Next to it, create an empty `main.js`.

::: tip `plugins` and `mods` are the same folder
LSE makes the folder `plugins` of the server a link to `mods` when it starts, so `plugins\MyPlugin` is the same folder. If you drop a single old-style script such as `MyPlugin.js` directly into it, LSE creates the folder and `manifest.json` for you on the next start; restart once more to load it.
:::

## 3. Say hello from the plugin

Write this into `main.js`:

```js
log("MyPlugin is running!");
```

`log` writes a line to the server console. You do not import or define it: LSE provides `log`, `mc` and the other objects of its API to every script.

Start the server (with **Start the server** in `lip`, or `lip run`). You should see a line with `MyPlugin is running!` among the lines in which LeviLamina loads the mods. If the plugin has an error, the console shows it there instead, with the line number.

Stop the server again before the next step.

## 4. Add a console command

Add a command that only the server console can run:

```js
mc.regConsoleCmd("greet", "Greets someone from the console", (args) => {
    log(`Hello, ${args[0] ?? "world"}!`);
});
```

`mc.regConsoleCmd` registers a command and the function that runs for it. LSE splits what follows the command into `args`.

Start the server and type `greet Steve` in its input line. You should see `Hello, Steve!`.

## 5. Greet players when they join

Now react to a game event. `mc.listen` calls your function every time the event happens; `onJoin` is the event of a player entering the game, and your function gets that player:

```js
mc.listen("onJoin", (player) => {
    log(`${player.name} has joined the server.`);
    player.sendToast("Welcome!", "Thanks for joining the server!");
    const loginReward = mc.newItem("minecraft:diamond", 1);
    mc.spawnItem(loginReward, player.pos);
});
```

Line by line:

1. `log(...)` writes the name of the player to the console.
2. `player.sendToast(title, message)` shows a toast at the top of the player's screen.
3. `mc.newItem(name, count)` creates an item stack: one diamond.
4. `mc.spawnItem(item, pos)` drops it into the world at the player's position.

Your whole `main.js` now holds the three parts of steps 3, 4 and 5. Restart the server, then join it from Minecraft (on the same PC: address `127.0.0.1`, port `19132`). You should see:

- in the console, `<your name> has joined the server.`;
- in the game, the toast **Welcome!** and a diamond on the ground next to you.

::: tip Work in small steps
Change one thing, restart, check. When something breaks, you then know which change did it. Every error of your plugin, and of the API calls it makes, appears in the server console.
:::

## 6. Get editor help (optional)

Your editor does not know `mc`, `log` and the rest of the API by itself. The [legacy-script-engine-api](https://github.com/LiteLDev/legacy-script-engine-api) repository has type definitions for JavaScript and TypeScript (and for Python) that give you completion and inline documentation; follow its README for your editor.

## What you have now

- The JavaScript engine of LSE on your server.
- The plugin `mods\MyPlugin`: a `manifest.json` and a `main.js` with a console command and a join event.
- The way to work on it: edit `main.js`, restart the server, read the console.

## Next steps

- Every event you can listen to: [Event listening](https://levimc.org/LegacyScriptEngine/apis/EventAPI/Listen/) and [Player events](https://levimc.org/LegacyScriptEngine/apis/EventAPI/PlayerEvents/).
- What you can do with a player: [Player API](https://levimc.org/LegacyScriptEngine/apis/GameAPI/Player/).
- Commands with arguments and permissions, for players too: [Command API](https://levimc.org/LegacyScriptEngine/apis/GameAPI/Command/).
- Dialogs for players: [Form API](https://levimc.org/LegacyScriptEngine/apis/GuiAPI/Form/). Settings in a file: [Config file API](https://levimc.org/LegacyScriptEngine/apis/DataAPI/ConfigFile/).
- The whole API, and the other languages: [LegacyScriptEngine API](https://levimc.org/LegacyScriptEngine/apis/) and [Language support](https://levimc.org/LegacyScriptEngine/apis/LanguageSupport/).
- Common questions: [LegacyScriptEngine FAQ](https://levimc.org/LegacyScriptEngine/faq/).
- Share your plugin as a `lip` package: a `self` asset in [lip.toml](https://levimc.org/lip/concepts/lip_toml.html) installs the files of your repository, and [Publish your mod with lip](publish-a-package.md) shows the release steps.
- Need more speed or access to the game's internals: [Your first LeviLamina mod](first-levilamina-mod.md).
