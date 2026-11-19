# Events and Hooks

A mod has two ways to react to what the game does: it can **hook** a function of the game, or **listen** to an
**event** that LeviLamina publishes. This page explains how the two work and how they are related. The how-to guides
show how to use them: [Hook Guide](../developer_guides/how_to_guides/hook_guide.md) and
[Event Guide](../developer_guides/how_to_guides/event_guide.md); the API is on the
[Memory & Hook](../api_reference/memory.md) and [Event](../api_reference/event.md) pages.

## Hooks

A hook replaces a function of the game with a function of your mod, the **detour**. When the game calls the
function, your detour runs instead; it calls `origin(...)` to run the original function, and can change the
arguments, the result, or not call it at all. The function to hook is named by a function pointer from the game's
headers (`mc/`), a symbol, an address or a signature.

Several mods can hook the same function. Their detours form a chain ordered by `HookPriority` (`Highest`, `High`,
`Normal`, `Low`, `Lowest`): each `origin(...)` calls the next detour, and the last one calls the game's function.

A hook is active only while it is installed:

- A hook declared with an `LL_AUTO_` macro is installed when its DLL is loaded, as a static object of the DLL, before
  the mod's `load()` runs.
- Any other hook is installed by its `hook()` and removed by its `unhook()`. A `ll::memory::HookRegistrar<Hooks...>`
  object installs its hooks when it is created and removes them when it is destroyed; a hook held by several
  registrars stays installed until the last one is destroyed.

## Events

An event is an object that describes something that happened, such as `PlayerJoinEvent`. Every event goes through
one `EventBus`:

- **Publishing.** The code that knows the thing happened creates the event and calls `EventBus::publish`. The bus
  calls the listeners of that event type, one after the other, on the thread that published it.
- **Listening.** A listener is a callback for one event type with an `EventPriority`. Listeners are called from
  `Highest` to `Lowest`; listeners of the same priority in the order they were created.
- **Cancelling.** An event that derives from `Cancellable` can be cancelled by a listener. The bus then calls no more
  listeners, and the publisher decides what cancelling means: a cancelled `PlayerAttackEvent`, for example, stops the
  attack. The [Event](../api_reference/event.md#built-in-events) page lists
  which built-in events can be cancelled.
- **Errors.** An exception thrown by a listener is caught and logged with the name of its mod; the next listener
  still runs.

## How Events Use Hooks

Most built-in events are published by hooks. The event `PlayerAttackEvent`, for example, is published by a hook on
`Player::attack`: the detour publishes the event, and returns without calling the original function when a listener
has cancelled it (see [Publishing Events](../developer_guides/how_to_guides/event_guide.md#publishing-events)).

These hooks are not installed all the time. Each event type has an **emitter**, a class that holds the hooks of the
event (in a `HookRegistrar`). LeviLamina creates the emitter when the first listener of the event is added, and
destroys it, removing its hooks, when the last listener is removed. A game function that nobody listens to through
an event is not hooked.

A mod can provide events of its own in the same way: an event class (it must be `final`), an emitter, and the hooks
or the code that publishes it.

## Listeners Belong to Mods

Every listener belongs to a mod: by default the mod whose code created it (`NativeMod::current()`). LeviLamina uses
this to clean up after a mod:

- When a mod is **disabled** while the game runs, its listeners are removed.
- When a mod is **unloaded**, its listeners are removed, and so are the events the mod provided, with their listeners
  in other mods.

That is why a mod adds its listeners in `enable()`: they are removed when it is disabled, and added again when it is
enabled. See [Mod Lifecycle](mod_lifecycle.md).

`EventBus::publish(modName, event)` calls only the listeners that belong to the mod `modName`.

## Hook or Event?

- Use an **event** when there is one for what you want: it is shared with every other mod, it is installed only while
  someone listens, and it is removed with your mod.
- Use a **hook** for what no event covers. Find the function with the [Find Function Guide](../developer_guides/how_to_guides/find_function_guide.md),
  and keep the priority at `Normal` unless you have a reason not to.

## Related

- [Event](../api_reference/event.md) — `EventBus`, `Listener`, `EventPriority`, `Cancellable` and the built-in events
- [Memory & Hook](../api_reference/memory.md) — the hook macros, `HookPriority` and `HookRegistrar`
- [Architecture](../developer_guides/architecture.md) — where the event system and the hooks are in LeviLamina
