# 显示表单

表单就是 Minecraft 基岩版的对话框：带标题、文本和按钮的窗口，或带输入控件的窗口。插件把表单发给一个玩家，并在回调中得到玩家的回答。
本指南用一个命令打开菜单，请玩家输入内容，再请玩家确认。

示例使用 JavaScript；API 在每种语言中都相同。参考见[普通表单构建器 API](../apis/GuiAPI/FormBuilder.md) 和[表单 API](../apis/GuiAPI/Form.md)。

## 1. 按钮菜单

普通表单有标题、文本和按钮。用 `mc.newSimpleForm()` 构建它；每个函数都返回表单本身，因此可以链式调用：

```js
const menu = mc.newSimpleForm()
    .setTitle("Menu")
    .setContent("What do you want to do?")
    .addButton("Rules", "textures/items/apple")
    .addButton("Players online")
    .addButton("Close");
```

`addButton` 的第二个参数是可选的图片：游戏中某个纹理的路径，例如 `textures/items/apple`，或者一个 URL。

## 2. 发送表单并处理回答

`pl.sendForm(form, callback)` 把表单显示给一个玩家。回调得到玩家和他按下的按钮序号（从 0 开始）；如果玩家关闭了表单，序号为 `Null`：

```js
function openMenu(player) {
    player.sendForm(menu, (player, id) => {
        if (id == null) return; // 已关闭
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

重启服务器，在游戏中输入 `/menu`。一个表单对象可以发送任意多次、发给任意多个玩家：每次发送都有自己的回调。

## 3. 带输入控件的表单

自定义表单包含玩家要填写的控件：输入框、开关、下拉菜单和滑块。用 `mc.newCustomForm()` 构建它：

```js
const settings = mc.newCustomForm()
    .setTitle("Settings")
    .addInput("Nickname", "Enter a nickname", "")
    .addSwitch("Show welcome messages", true)
    .addDropdown("Team", ["Red", "Blue", "Green"], 0)
    .addSlider("View distance", 2, 16, 1, 8);
```

回调得到一个数组，按表单中的顺序存放每个控件的值；如果玩家关闭了表单，则为 `Null`：

```js
player.sendForm(settings, (player, data) => {
    if (data == null) return; // 已关闭
    const [nickname, welcome, team, distance] = data;
    player.tell(`Nickname: ${nickname}, welcome messages: ${welcome}, team: ${team}, view distance: ${distance}`);
});
```

构建你自己的表单时，先用 `log` 输出一次 `data`，看看哪个下标对应哪个控件、每个值是什么样子。

## 4. 请玩家确认

模式表单有一段文本和两个按钮。`pl.sendModalForm` 一次调用就能发送它；按下第一个按钮时回调得到 `true`，第二个按钮得到
`false`，玩家关闭表单时得到 `Null`：

```js
player.sendModalForm("Reset", "Reset your settings?", "Yes", "No", (player, result) => {
    if (result) {
        player.tell("Your settings were reset.");
    }
});
```

## 须知

- `sendForm` 和 `sendModalForm` 返回表单的 ID；无法发送时返回 `Null`。
- 回调还会得到第三个参数，即表单关闭的原因：`0` 表示玩家关闭了它，`1` 表示玩家正忙。它可能为 `Null`。
- `pl.closeForm()` 关闭玩家当前打开的表单。
- 也可以不用构建器发送表单：`pl.sendSimpleForm` 以文本数组和图片数组给出按钮，`pl.sendCustomForm` 接受表单的 JSON。
  见[表单 API](../apis/GuiAPI/Form.md)。
