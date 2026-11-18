# LegacyScriptEngine API：表单与界面显示

## LSE 中玩家关闭表单（按 Esc/返回）时回调收到什么？文档写的是 Null，但 JS 里 `data === null` 判断失效，怎么办？

玩家取消表单时，回调中的结果（SimpleForm 的 `id`、CustomForm 的 `data`、ModalForm 的 `result`）为空值。由于 ScriptX 在 C++ 层不区分 null 和 undefined，LSE 返回的空 `Local<Value>` 在 JS 中实际是 `undefined`，所以 `data === null` 会失效。请用 `data == null` 或 `!data`（注意 `id` 为 0 时 `!id` 也为真，SimpleForm 建议用 `id == null`）判断玩家是否关闭了表单。回调第三个参数 `reason` 表示取消原因（0 = UserClosed，1 = UserBusy），也可能为空。

*适用版本：当前所有 LSE 版本*

## LSE/LLSE 脚本插件中，玩家点击表单后如何让玩家返回上一个表单？如何判断玩家关闭了表单？

再次调用 `pl.sendForm(form, callback)` 把上一个表单发给玩家即可。常见写法：

1. 把表单的构建和发送封装成一个具名函数（回调也定义为具名函数），需要返回时在回调里再次调用该函数；
2. 缓存上一个表单实例，返回时用 `player.sendForm` 传入缓存的实例和回调；
3. 用一个类维护“当前表单/上一个表单”的会话栈实现多级返回。

玩家直接关闭表单时，回调的结果参数为空（JS 中为 `undefined`），用 `data == null` 判断即可。

*适用版本：当前所有 LSE 版本（LLSE 时期写法同样适用）*

## LSE/LLSE 表单按钮（`SimpleForm.addButton`）的图片参数可以用哪些来源？怎么用自定义图片？

`addButton(text, image)` 的 `image` 有两种：

1. 资源包纹理路径，如原版的 `textures/items/diamond`，或在自制资源包中放 `textures/test/test.png` 后填 `textures/test/test`，需要玩家加载该资源包；
2. 以 `http` 开头的网络图片 URL（LSE 会自动识别为 url 类型）。

URL 图片在客户端加载较慢、偶有显示问题，属于客户端行为，追求稳定建议用资源包路径。图片尺寸没有硬性限制，主要影响显示比例。

*适用版本：当前所有 LSE 版本*

## 觉得 LSE 自带的表单 API 不好用，有没有可以直接给按钮绑定回调、支持 async 的表单封装库？

可以使用第三方库 FormAPIEx（<https://github.com/lgc-LLDev/FormAPIEx>），提供带类型提示（d.ts）、async 语法、按钮直接绑定回调的表单封装，示例见仓库中的 `FormAPIExExample.js`。另外 XYSDK（<https://github.com/xianyubb/XYSDK>）中也有类似封装。也可以自己把 LSE 的 `mc.newSimpleForm` / `mc.newCustomForm` 封装成 Promise 风格。

*适用版本：LSE（JS）；第三方库兼容性需自行确认。未能从源码或文档中直接证实，仅供参考。*

## LSE 自定义表单 `fm.addDropdown` 传入在线玩家列表时报错 `"can't cast value as string"`，如何在下拉菜单中列出所有在线玩家名字？

`mc.getOnlinePlayers()` 返回的是 `Array<Player>`，而 `fm.addDropdown(title, items[, default, tooltip])` 的 `items` 要求 `Array<String>`，直接传 Player 对象会在转换为字符串时报 `can't cast value as string`。先转成名字数组再传入：

```js
let names = mc.getOnlinePlayers().map(player => player.name);
fm.addDropdown("选择玩家", names);
```

玩家名通过 Player 的 `name`（或 `realName`）属性获取。

*适用版本：LegacyScriptEngine 当前版本*

## LSE 中发送给玩家的表单（Form）只能由客户端交互关闭吗？有没有办法用代码强制关闭或覆盖已打开的表单？

现在 LSE 直接提供了 `pl.closeForm()`，会向客户端发送关闭表单的数据包（ClientboundCloseFormPacket），不需要再手动构造数据包（`closeForm` 于 2025-05 加入）。

要覆盖/更新已打开的表单，可以在发送时传入可选参数 `forUpdating=true`（于 0.11.0 加入），例如 `pl.sendForm(fm, callback, true)`（`sendModalForm`/`sendSimpleForm`/`sendCustomForm` 同样支持），此时以表单更新的方式发送；各 `send*` 函数也会返回发送的表单 ID。

*适用版本：LSE 0.11.0 及以上*

## LSE 中如何创建并发送自定义表单（CustomForm）？

文档见 <https://levimc.org/zh-Hans/LegacyScriptEngine/apis/GuiAPI/FormBuilder/>。示例：

```js
var fm = mc.newCustomForm();
fm.setTitle("标题");
fm.addLabel("文本");
fm.addInput("描述", "提示", "默认内容");
fm.addSwitch("开关", false);
fm.addDropdown("下拉", ["选项1", "选项2"], 0);
fm.addSlider("滑块", 最小, 最大, 步长, 初始值);
fm.addStepSlider("步进滑块", ["选项1", "选项2"], 0);
pl.sendForm(fm, (player, data, reason) => { /* ... */ });
```

回调中的 `data` 是按控件顺序排列的数组，为 `null` 表示玩家取消了表单；`reason` 为取消原因：0 = UserClosed，1 = UserBusy，也可能为 `null`。新版还支持 `addHeader`/`addDivider`、各控件的 `tooltip` 参数以及 `setSubmitButton`。

## 在 LSE 中用 CustomForm（`mc.newCustomForm`）做自定义表单时，怎样取输入框的值？怎样区分玩家点了提交还是关掉了表单？

CustomForm 自带提交按钮，不用自己加。`pl.sendForm(fm, callback)` 的回调原型是 `function(player, data, reason)`：

- `data` 是按控件添加顺序排列的数组，取输入框的值用对应下标，比如第 3 个控件就是 `data[2]`。
- `data` 为 `null` 表示玩家取消或关闭了表单，不为 `null` 才是提交。
- `reason` 是取消原因（`0` = UserClosed，`1` = UserBusy），可能为 `null`。

不确定时可以把回调参数全部 `log` 出来看。

*适用版本：LSE 0.23.x*

## LSE 的 `player.sendForm` 等表单回调现在能拿到玩家取消表单的原因吗？

可以。自 LSE 0.9.0 起表单回调多了一个取消原因参数 `reason`（Integer，对应 LeviLamina 的 `FormCancelReason`），例如 `SimpleForm` 回调为 `function(player, id, reason)`，`CustomForm` 回调为 `function(player, data, reason)`；正常提交时 `reason` 可能为 `null`。

*适用版本：LSE 0.9.0 及以上*

## LSE 自定义表单 `addDropdown(title, [a, b])` 选中某项后，回调 `data` 中返回的是选项序号还是选项值？

返回的是选中项的序号（index，从 0 开始），例如选中第一项 `a` 返回 `0`，需要自己用 `items[data[i]]` 取值。

## LSE 自定义表单（`mc.newCustomForm`）中 `addInput` 输入框不填内容直接提交，回调返回的是空字符串、`undefined` 还是 `null`？玩家关闭表单时如何处理？

未输入内容就提交时，该项返回空字符串 `""`。玩家直接关闭或放弃表单时，回调的 `data`（`SimpleForm` 则是 `id`）为空（`null` / `undefined`），第三个参数 `reason` 表示取消原因（0 = `UserClosed`，1 = `UserBusy`，也可能为 `null`）。应在回调开头用 `if (data == null) return;` 判断，并可以提示用户表单已关闭。

## LSE（JS）中用 `pl.sendModalForm` 发送模式表单（确认/取消两个按钮）后，回调的 `result` 有哪些取值？需要额外判断 `null` 吗？

回调原型为 `function(player, result, reason)`。`result` 为 `true` 表示点击了确认（上方/按钮1），`false` 表示点击了取消（下方/按钮2）；玩家直接点 X 关闭表单时 `result` 没有值（文档写作 Null，JS 中实际拿到的是 `undefined`）。一般把它和取消按同样处理即可，例如 `if (result) {...} else {...}`，不必再单独 `else if` 判断 `null`。如需区分关闭原因，可看第三个参数 `reason`（表单取消原因，仅在取消时有值）。

*适用版本：LSE 0.9 及以上；当前 0.23.x*
