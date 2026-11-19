# Server authority

On Java Edition the client decides much of what happens to its player: where it is, what a click does to the
inventory, when a block is broken. On Bedrock Dedicated Server the **server** decides all three. BDS says so in
`start_game` (`server_authoritative_inventory`, `server_authoritative_block_breaking`), and movement is always
server-authoritative. The client sends what the player does; the server simulates it and answers with the result.

mineflayer's API is built for the Java model, where the client acts and then tells the server. bedboo keeps that API on
the Bedrock model by predicting what the server will do, sending the player's actions as Bedrock expects them, and
taking the server's answer as the truth. This page explains that model; the exact rules are in the
[Bedrock differences](../reference/differences/index.md).

## One input per tick {#input}

A Bedrock client sends one `player_auth_input` packet per server tick (every 50 ms), from spawn on. It carries the
position (at eye level), the movement keys, the rotation, flags such as sneaking and sprinting, and the block actions
of digging.

bedboo's input queue (`bot._bedrock.input`) keeps that stream going. Its clock is anchored on the server's tick from
`start_game`; each tick the physics engine moves the player one step and the queue sends the result, together with
whatever the plugins queued for that tick. When the timer runs late it sends the ticks it missed, up to
`maxCatchupTicks` (4) at once. Loading screens, death and dimension changes suspend the stream
([input stream](../reference/differences/movement.md#input)).

A consequence for bot code: a change sent in the stream takes effect with the next input, not at once. `look()`
resolves once the input with the new rotation was sent ([looking](../reference/differences/movement.md#look)), and a
click right after `setControlState('sneak')` waits until the sneak went out
([controls before clicks](../reference/differences/movement.md#controls-before-clicks)).

## Movement: predicted, then corrected {#movement}

BDS runs the same movement simulation as the client on every input it gets. When the position the client reports
moves further than its own result, it sends `correct_player_move_prediction` with its state and the tick of the input
it corrected.

bedboo predicts every tick with its Bedrock movement engine, so in the normal case the server agrees and sends
nothing. It keeps the inputs it sent; on a correction it goes back to the corrected tick, takes the server's state and
replays the inputs sent since, and emits `forcedMove`. Teleports, knockback and effects that name a tick are applied
from that tick in the same way ([corrections](../reference/differences/movement.md#corrections)).

## Inventory: item stack requests {#inventory}

Bedrock has no click packet. The client asks the server to move items between named container slots with an
`item_stack_request` (take, place, swap, drop, craft, …), and the server answers with an `item_stack_response`:
accepted, with the resulting counts, or rejected with an error code.

bedboo keeps mineflayer's Java-layout inventory and `clickWindow`. For each click it works out the result the Java
click would have, applies that result as a prediction, sends it as an item stack request and waits for the answer.
An accepted request fixes the counts and stack ids; a rejected one is rolled back, and `clickWindow` throws
mineflayer's own error. Everything built on clicks (`equip`, `transfer`, `deposit`, `craft`, …) works the same way
([click window](../reference/differences/inventory.md#click-window)). Packets in which the server sends its copy of the
inventory always win, and when bedboo finds a slot out of date it asks the server for its copy
([inventory resync](../reference/differences/inventory.md#inventory-resync), `bot.bedrock.resyncInventory()`).

## Digging and placing: the server's answer {#digging}

On BDS the server breaks blocks itself. The client says when the mouse goes down on a block (`start_break`); from then
on BDS adds the break progress every tick, with its own copy of the held item and the player's state, and destroys the
block when the progress is complete.

So `bot.dig()` does not end on a client-side timer as on Java. bedboo sends the start, follows the progress the server
reports, and resolves when the server's `update_block` says the block is gone; if the server shows no sign of breaking
it, the dig is aborted ([block breaking](../reference/differences/digging.md#protocol),
[completion](../reference/differences/digging.md#completion)). Placements are answered by the server too: each click
carries the server's copy of the held item, so bedboo sends the next placement once the previous one was answered (or after
500 ms) ([placements](../reference/differences/digging.md#placement-serialization)).

## What it means for a bot {#for-bots}

- Wait for the promises. `dig`, `placeBlock`, `clickWindow`, `equip` and the rest settle on the server's answer, with
  the same results and errors as on Java.
- Expect the server to have the last word. A move, a click or a dig the server refuses is undone, as the server says.
- Timings follow the server's ticks: an action takes effect in the next input, and a dig takes as long as the server
  takes to break the block.

With `transport: 'bedd'` the real client sends the inputs, the requests and the block actions itself, and bedboo
follows what it does instead of predicting it ([BeDD mode](../reference/differences/bedd.md)).
