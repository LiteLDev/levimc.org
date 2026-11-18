# LegacyScriptEngine API: forms and on-screen text

## What does the callback receive in LSE when a player closes a form (Esc/back)? The docs say Null, but the `data === null` check in JS does not work. What should I do?

When a player cancels a form, the result in the callback (the `id` of a SimpleForm, the `data` of a CustomForm, the `result` of a ModalForm) is empty. Because ScriptX does not distinguish null from undefined at the C++ level, the empty `Local<Value>` that LSE returns is actually `undefined` in JS, so `data === null` fails. Use `data == null` or `!data` to check whether the player closed the form (note that when `id` is 0, `!id` is also true, so for SimpleForm use `id == null`). The third callback parameter, `reason`, indicates the cancel reason (0 = UserClosed, 1 = UserBusy) and may also be empty.

*Applies to: all current LSE versions*

## In an LSE/LLSE script plugin, how do I send the player back to the previous form after they click a form, and how do I detect that the player closed the form?

Call `pl.sendForm(form, callback)` again with the previous form. Common approaches:

1. Wrap building and sending the form in a named function (and define the callback as a named function too); to go back, call that function again from the callback.
2. Cache the previous form instance and, when going back, pass the cached instance and the callback to `player.sendForm`.
3. Use a class that keeps a session stack of the "current form / previous form" to support multi-level back navigation.

When the player closes the form directly, the result argument of the callback is empty (`undefined` in JS). Check it with `data == null`.

*Applies to: all current LSE versions (the LLSE-era approach works too)*

## What can the image parameter of an LSE/LLSE form button (`SimpleForm.addButton`) be, and how do I use a custom image?

The `image` of `addButton(text, image)` can be one of two things:

1. A resource pack texture path, such as the vanilla `textures/items/diamond`, or, for a custom resource pack that contains `textures/test/test.png`, `textures/test/test`. The player must load that resource pack.
2. A network image URL starting with `http` (LSE detects it as the url type automatically).

URL images load slowly on the client and occasionally fail to display. This is client behavior, so use a resource pack path if you want stability. There is no hard limit on image size; it mainly affects the display ratio.

*Applies to: all current LSE versions*

## The built-in LSE form API is awkward. Is there a form wrapper library that binds callbacks directly to buttons and supports async?

Use the third-party library FormAPIEx (<https://github.com/lgc-LLDev/FormAPIEx>), which provides a form wrapper with type hints (d.ts), async syntax and callbacks bound directly to buttons. See `FormAPIExExample.js` in the repository for an example. XYSDK (<https://github.com/xianyubb/XYSDK>) also contains a similar wrapper. You can also wrap LSE's `mc.newSimpleForm` / `mc.newCustomForm` in a Promise style yourself.

*Applies to: LSE (JS); compatibility of third-party libraries is up to you to verify. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Passing the online player list to the `fm.addDropdown` of an LSE custom form throws `"can't cast value as string"`. How do I list all online player names in the dropdown?

`mc.getOnlinePlayers()` returns `Array<Player>`, while the `items` of `fm.addDropdown(title, items[, default, tooltip])` must be `Array<String>`. Passing Player objects directly throws `can't cast value as string` when they are converted to strings. Convert to an array of names first and pass that:

```js
let names = mc.getOnlinePlayers().map(player => player.name);
fm.addDropdown("选择玩家", names);
```

Get the player name from the Player's `name` (or `realName`) property.

*Applies to: current version of LegacyScriptEngine*

## In LSE, can a form sent to a player only be closed by client interaction? Is there a way to force-close or overwrite an open form from code?

LSE now provides `pl.closeForm()` directly. It sends a packet that closes the form to the client (ClientboundCloseFormPacket), so you no longer need to build the packet manually (`closeForm` was added in 2025-05).

To overwrite/update an open form, pass the optional parameter `forUpdating=true` (added in 0.11.0) when sending, for example `pl.sendForm(fm, callback, true)` (`sendModalForm`/`sendSimpleForm`/`sendCustomForm` support it as well). The form is then sent as a form update. The `send*` functions also return the ID of the form that was sent.

*Applies to: LSE 0.11.0 and later*

## In LSE, how do I create and send a custom form (CustomForm)?

See the docs at <https://levimc.org/LegacyScriptEngine/apis/GuiAPI/FormBuilder/>. Example:

```js
var fm = mc.newCustomForm();
fm.setTitle("标题");
fm.addLabel("文本");
fm.addInput("描述", "提示", "默认内容");
fm.addSwitch("开关", false);
fm.addDropdown("下拉", ["选项1", "选项2"], 0);
fm.addSlider("滑块", min, max, step, initial);
fm.addStepSlider("步进滑块", ["选项1", "选项2"], 0);
pl.sendForm(fm, (player, data, reason) => { /* ... */ });
```

In the callback, `data` is an array ordered by control; `null` means the player canceled the form. `reason` is the cancel reason: 0 = UserClosed, 1 = UserBusy, and it can also be `null`. Newer versions also support `addHeader`/`addDivider`, the `tooltip` parameter of each control, and `setSubmitButton`.

## When building a form with CustomForm (`mc.newCustomForm`) in LSE, how do I get the value of an input box? How do I tell whether the player submitted the form or closed it?

CustomForm has a submit button built in; you do not need to add one. The callback prototype of `pl.sendForm(fm, callback)` is `function(player, data, reason)`:

- `data` is an array in the order the controls were added. Use the matching index to get an input box's value; for example, the 3rd control is `data[2]`.
- `data` being `null` means the player cancelled or closed the form; if it is not `null`, the form was submitted.
- `reason` is the cancel reason (`0` = UserClosed, `1` = UserBusy) and may be `null`.

If you are unsure, `log` all the callback parameters to see them.

*Applies to: LSE 0.23.x*

## Can LSE form callbacks such as `player.sendForm` now tell why the player cancelled the form?

Yes. Since LSE 0.9.0, form callbacks have an extra cancellation reason parameter `reason` (Integer, corresponding to LeviLamina's `FormCancelReason`). For example, a `SimpleForm` callback is `function(player, id, reason)` and a `CustomForm` callback is `function(player, data, reason)`. On a normal submission, `reason` may be `null`.

*Applies to: LSE 0.9.0 and later*

## After a selection in an LSE custom form's `addDropdown(title, [a, b])`, does the callback's `data` contain the option index or the option value?

It contains the index of the selected item (starting from 0). For example, selecting the first item `a` returns `0`, and you look up the value yourself with `items[data[i]]`.

## In an LSE custom form (`mc.newCustomForm`), if an `addInput` field is left empty and the form is submitted, does the callback return an empty string, `undefined` or `null`? How do I handle the player closing the form?

If the field is submitted without input, it returns an empty string `""`. When the player closes or abandons the form, the callback's `data` (or `id` for a `SimpleForm`) is empty (`null` / `undefined`), and the third parameter `reason` gives the cancellation reason (0 = `UserClosed`, 1 = `UserBusy`, and it may also be `null`). Check with `if (data == null) return;` at the start of the callback, and optionally tell the user the form was closed.

## In LSE (JS), after sending a modal form (two buttons, confirm and cancel) with `pl.sendModalForm`, what values can the callback's `result` take? Do I need an extra `null` check?

The callback prototype is `function(player, result, reason)`. `result` is `true` when the player clicked confirm (the upper button, button 1) and `false` when they clicked cancel (the lower button, button 2). When the player closes the form with X, `result` has no value (the documentation says Null, but JS actually receives `undefined`). You can usually handle it the same way as cancel, for example `if (result) {...} else {...}`, without a separate `else if` check for `null`. To distinguish why the form was closed, look at the third parameter `reason` (the form cancellation reason, which has a value only on cancellation).

*Applies to: LSE 0.9 and later; still applies to current 0.23.x*
