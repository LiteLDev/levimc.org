# Showing forms

Forms are the dialogs of Minecraft Bedrock: a window with a title, text and buttons, or a window with input fields.
A plugin sends a form to one player and gets the player's answer in a callback. This guide opens a menu with a
command, asks the player for input, and asks for confirmation.

The examples are in JavaScript; the API is the same in every language. The references are the
[Form builder API](../apis/GuiAPI/FormBuilder.md) and the [Form API](../apis/GuiAPI/Form.md).

## 1. A menu of buttons

A simple form has a title, a text and buttons. Build it with `mc.newSimpleForm()`; each function returns the form, so
the calls can be chained:

```js
const menu = mc.newSimpleForm()
    .setTitle("Menu")
    .setContent("What do you want to do?")
    .addButton("Rules", "textures/items/apple")
    .addButton("Players online")
    .addButton("Close");
```

The second argument of `addButton` is an optional image: the path of a texture of the game, such as
`textures/items/apple`, or a URL.

## 2. Send it and handle the answer

`pl.sendForm(form, callback)` shows the form to a player. The callback gets the player and the number of the button
they pressed, from 0, or `Null` if they closed the form:

```js
function openMenu(player) {
    player.sendForm(menu, (player, id) => {
        if (id == null) return; // closed
        switch (id) {
            case 0:
                player.tell("Be nice, and have fun.");
                break;
            case 1:
                player.tell(`Online: ${mc.getOnlinePlayers().map((p) => p.name).join(", ")}`);
                break;
        }
    });
}

mc.regPlayerCmd("menu", "Opens the menu", (player, args) => {
    openMenu(player);
});
```

Restart the server and type `/menu` in the game. One form object can be sent any number of times, to any number of
players: each sending gets its own callback.

## 3. A form with input fields

A custom form has controls that the player fills in: text inputs, switches, drop-down menus and sliders. Build it with
`mc.newCustomForm()`:

```js
const settings = mc.newCustomForm()
    .setTitle("Settings")
    .addInput("Nickname", "Enter a nickname", "")
    .addSwitch("Show welcome messages", true)
    .addDropdown("Team", ["Red", "Blue", "Green"], 0)
    .addSlider("View distance", 2, 16, 1, 8);
```

The callback gets an array with the value of each control, in the order of the form, or `Null` if the player closed
the form:

```js
player.sendForm(settings, (player, data) => {
    if (data == null) return; // closed
    const [nickname, welcome, team, distance] = data;
    player.tell(`Nickname: ${nickname}, welcome messages: ${welcome}, team: ${team}, view distance: ${distance}`);
});
```

When you build a form of your own, print `data` with `log` once to see which index holds which control and what
each value looks like.

## 4. Ask for confirmation

A modal form has a text and two buttons. `pl.sendModalForm` sends it in one call; the callback gets `true` for the
first button, `false` for the second, and `Null` if the player closed the form:

```js
player.sendModalForm("Reset", "Reset your settings?", "Yes", "No", (player, result) => {
    if (result) {
        player.tell("Your settings were reset.");
    }
});
```

## Good to know

- `sendForm` and `sendModalForm` return the ID of the form, or `Null` if it could not be sent.
- The callback also gets a third parameter, the reason the form was closed: `0` if the player closed it, `1` if the
  player was busy. It may be `Null`.
- `pl.closeForm()` closes the form the player has open.
- The forms can also be sent without a builder: `pl.sendSimpleForm` takes the buttons as arrays of texts and images,
  `pl.sendCustomForm` the JSON of the form. See the [Form API](../apis/GuiAPI/Form.md).
