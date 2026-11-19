# Registering commands

A plugin can add commands to the game. Players type them after `/` with the usual completion and hints; the console,
command blocks and NPCs can run them too. This guide registers a command with parameters, a permission and a callback,
then shows the simpler commands of LLSE.

The examples are in JavaScript; the API is the same in every language. [Command API](../apis/GameAPI/Command.md) is
the reference for every function used here.

## 1. Create the command

Create the command at the top level of your entry script, or in an `onServerStarted` listener as the reference
does: while the server is still starting, LSE postpones the registration until commands can be registered, so both
work. This guide uses the listener:

```js
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("hello", "Says hello to players", PermType.Any);
    // parameters, overloads and the callback: steps 2 to 4
    cmd.setup();
});
```

`mc.newCommand(name, description, permission)` creates the command and returns a command object, which you then
configure. Its name must be in lowercase English letters. The permission says who may run it:

| Permission | Who may run the command |
|---|---|
| `PermType.Any` | Anyone. |
| `PermType.GameMasters` | Operators. |
| `PermType.Admin` | The admin permission level (the default). |
| `PermType.Console` | The console only. |

`cmd.setAlias("hi")` adds another name for the same command.

## 2. Add parameters

Each parameter has a name and a type. `mandatory` adds a parameter that must be given, `optional` one that may be
left out:

```js
cmd.mandatory("target", ParamType.Player);
cmd.optional("message", ParamType.RawText);
```

`ParamType.Player` takes a player name or a target selector such as `@a`. `ParamType.RawText` takes the rest of the
line, spaces included; it can only be the last parameter. The [list of parameter types](../apis/GameAPI/Command.md)
gives every type and the value your callback gets for it.

## 3. Declare the forms of the command

An overload is one form of the command: the list of its parameters, in order:

```js
cmd.overload(["target", "message"]);
```

With this overload, `/hello Steve`, `/hello Steve Nice to see you!` and `/hello @a Welcome!` are valid. Declare one
overload per form when a command has several, for example `/hello <target> [message]` and `/hello all`.

## 4. Handle the command

The callback runs each time the command is run. It gets the command, the origin (who or what ran it), the output
(where to write the result) and the values of the parameters, by name:

```js
cmd.setCallback((_cmd, origin, output, results) => {
    const from = origin.player ? origin.player.name : "The server";
    for (const player of results.target) {
        player.tell(`${from} says: ${results.message ?? "Hello!"}`);
    }
    output.success(`Said hello to ${results.target.length} player(s).`);
});
```

- `origin.player` is the player who ran the command, `Null` when the console or a command block ran it.
- `results.target` is an array of players: a selector can match several.
- `results.message` has no value when the optional parameter was left out.
- `output.success(msg)` shows the result to whoever ran the command; `output.error(msg)` shows an error.

Then `cmd.setup()` registers the command with the game. The whole plugin:

```js
mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("hello", "Says hello to players", PermType.Any);
    cmd.mandatory("target", ParamType.Player);
    cmd.optional("message", ParamType.RawText);
    cmd.overload(["target", "message"]);
    cmd.setCallback((_cmd, origin, output, results) => {
        const from = origin.player ? origin.player.name : "The server";
        for (const player of results.target) {
            player.tell(`${from} says: ${results.message ?? "Hello!"}`);
        }
        output.success(`Said hello to ${results.target.length} player(s).`);
    });
    cmd.setup();
});
```

Restart the server and type `/hello @a` in the game, or `hello @a` in the console.

## Sub-commands with enumerations

For a command such as `/manager add <name>` and `/manager list`, use an enumeration: a fixed set of words. Give each
set of words a name with `setEnum`, add a parameter of type `ParamType.Enum` for it, and name the enumeration in the
overload. This is the example of the reference:

```js
mc.listen("onServerStarted", () => {
    let cmd = mc.newCommand("manager", "Command Description", PermType.GameMasters);
    cmd.setAlias("mgr");
    cmd.setEnum("ChangeAction", ["add", "remove"]);
    cmd.setEnum("ListAction", ["list"]);
    cmd.mandatory("action", ParamType.Enum, "ChangeAction", 1);
    cmd.mandatory("action", ParamType.Enum, "ListAction", 1);
    cmd.mandatory("name", ParamType.RawText);
    cmd.overload(["ChangeAction", "name"]);
    cmd.overload(["ListAction"]);
    cmd.setCallback((_cmd, _ori, out, res) => {
        switch (res.action) {
            case "add":
                return out.success(`add "${res.name}"`);
            case "remove":
                return out.success(`remove "${res.name}"`);
            case "list":
                return out.success(`Name List:`);
        }
    });
    cmd.setup();
});
```

Both enumeration parameters are named `action`, so the callback reads the word in `res.action`; the overloads name
the enumerations, which tell them apart. For a set of words that changes while the server runs (player names, home
names), use a soft enumeration: `setSoftEnum`, `addSoftEnumValues` and `ParamType.SoftEnum`.

## The simple commands of LLSE

`mc.regPlayerCmd` and `mc.regConsoleCmd` register a command and its function in one call, and pass the words after it
as an array of strings:

```js
mc.regPlayerCmd("ping", "Answers with pong", (player, args) => {
    player.tell("Pong!");
});

mc.regConsoleCmd("backup", "Starts a backup", (args) => {
    log(`Starting backup ${args[0] ?? "default"}.`);
});
```

They are kept for plugins written for LLSE. Only players (`regPlayerCmd`) or the console (`regConsoleCmd`) can run
them, not command blocks or NPCs, and you parse the arguments yourself. Use `mc.newCommand` for new plugins.

## Run a command from a plugin

`mc.runcmd("say Hello!")` runs a command in the background and returns whether it succeeded. `mc.runcmdEx` also returns
its output, without writing it to the console:

```js
const result = mc.runcmdEx("list");
log(result.output);
```
