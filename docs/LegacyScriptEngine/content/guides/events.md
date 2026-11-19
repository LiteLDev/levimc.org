# Listening to events

A plugin reacts to the game through events: a player joins, sends a chat message, breaks a block. This guide shows
how to listen to an event, how to stop the game from processing it, and how to find the event you need.

You need a plugin that loads: see [Your first script plugin](https://levimc.org/tutorials/develop/first-script-plugin/).
The examples are in JavaScript; the API is the same in every language.

## 1. Listen to an event

Call `mc.listen` with the name of the event and the function to call each time it happens. Do it at the top level of
your entry script, so that the listener is registered when the plugin loads:

```js
mc.listen("onJoin", (player) => {
    player.tell(`Welcome, ${player.name}!`);
    log(`${player.name} has joined the server.`);
});
```

The function gets the parameters of the event: `onJoin` passes the player who entered the game. Each event's page
gives its parameters, such as [Player events](../apis/EventAPI/PlayerEvents.md) for `onJoin`.

The same in Lua:

```lua
mc.listen("onJoin", function(player)
    mc.broadcast(player.name .. " has joined the server.")
end)
```

`mc.listen` returns `false` if it could not register the listener, for example for an event name that does not exist.

## 2. Intercept an event

Many events can be intercepted: their page says "Intercept events: function returns `false`". Return `false` from
the listener and the game does not process the event, as if it had not happened. This listener drops chat messages
that contain a word:

```js
mc.listen("onChat", (player, msg) => {
    if (msg.includes("badword")) {
        player.tell("Please keep the chat friendly.");
        return false;
    }
});
```

The message is not shown to anyone. Return nothing (or anything but `false`) to let the event through.

Intercepting only stops the game. The listeners of other plugins for the same event are still called: LSE calls
every listener of an event in the order they were registered, which is in general the order the plugins were loaded.
To have your listener run before another plugin's, make that plugin depend on yours in its `manifest.json` (see
[Plugins and engines](../concepts/plugins.md)).

## 3. Check what you get

Some parameters can be `Null`: the [Player death event](../apis/EventAPI/PlayerEvents.md) passes the entity that
killed the player, which is `Null` when no entity did. Check before you use such a value:

```js
mc.listen("onPlayerDie", (player, source) => {
    if (source) {
        log(`${player.name} was killed by ${source.name}.`);
    } else {
        log(`${player.name} died.`);
    }
});
```

Keep listeners short. They run on the server's thread, so a slow listener holds up the server, the more so for
frequent events such as `onTick`.

## 4. Avoid loops

A listener that causes its own event again never ends. For example, an `onConsoleCmd` listener that calls
`mc.runcmd` triggers `onConsoleCmd` once more. Check the input before you act, or use another event.

## Find the event you need

The events are listed by subject:

- [Player events](../apis/EventAPI/PlayerEvents.md): joining, leaving, chat, commands, dying, using items …
- [Entity events](../apis/EventAPI/EntityEvents.md) and [Block events](../apis/EventAPI/BlockEvents.md).
- [Economic events](../apis/EventAPI/EconomicEvents.md): changes of money.
- [Other events](../apis/EventAPI/OtherEvents.md): the server starting (`onServerStarted`), every tick (`onTick`),
  console commands, scores.

[Event listening](../apis/EventAPI/Listen.md) describes `mc.listen` itself.
