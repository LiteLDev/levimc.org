# 用 Be.D.D. 驱动游戏客户端

完成本教程后，Minecraft 基岩版会在你电脑的后台运行，由你编写的脚本驱动：脚本把最前面的界面读成文字，截一张图，然后再关掉游戏。你完全不用碰游戏窗口，同时还能照常使用鼠标和键盘。这正是 Be.D.D.（Bedrock Deep Dive）的用途：LeviLamina 客户端模组的端到端测试，以及其他任何需要由程序控制真实游戏客户端的场景。

大约需要半小时，大部分时间在下载游戏。

::: warning 这是测试工具
`mods\` 里有 Be.D.D. 的游戏不理会你真实的鼠标和键盘，只显示在 Be.D.D. 的管理窗口里。Be.D.D. 只装进它自己的游戏副本，从不装进你玩的实例。
:::

## 你需要准备

- 一台 Windows 10 或 11 电脑（x64）。
- 一个拥有 Minecraft（Windows 版）的 Microsoft 账号。
- [LeviLauncher](https://levimc.org/zh-Hans/LeviLauncher/) 1.1 或更高版本。如果还没装，请完成[在 Windows 上玩模组](../play/play-with-mods.md)的第 1、2 步。
- [Node.js](https://nodejs.org/zh-cn) 24 或更高版本，用来运行脚本。用 `node -v` 检查。

不需要 PowerShell 模块、`lip` 或 .NET 运行时。

## 1. 安装基础实例

Be.D.D. 0.4 驱动的是装有 LeviLamina **26.60.x** 的 Minecraft **1.26.60**（GDK 正式版）。它会复制 LeviLauncher 中的这个实例，从不修改或启动原实例，原实例称为**基础实例**。

在终端中运行 LeviLauncher 的命令行（如果 `LeviLauncher.exe` 不在 `PATH` 中，请使用它的完整路径）：

```powershell
LeviLauncher.exe account login              # 每台电脑一次：登录拥有 Minecraft 的账号
LeviLauncher.exe install 1.26.60 --loader   # 1.26.60 GDK 正式版，带 LeviLamina
LeviLauncher.exe instance list              # 检查结果
```

你应该在列表中看到一个游戏版本为 `1.26.60.xx`、加载器为 `26.60.x` 的实例。

如果你更喜欢 LeviLauncher 的窗口界面，也可以按[在 Windows 上玩模组](../play/play-with-mods.md)的第 3 步，在界面中添加带 LeviLamina 的 1.26.60 版本，效果相同。

## 2. 安装 Be.D.D.

1. 从[最新发布](https://github.com/LiteLDev/BeDD/releases/latest)下载 `bedd-windows-x64-setup.exe` 并运行。它不需要管理员权限：按用户安装到 `%LOCALAPPDATA%\Programs\BeDD`，在开始菜单中添加 **BeDD**，并把该文件夹加入 `PATH`。
2. 打开一个**新的**终端并运行：

   ```powershell
   BeDD.exe version
   ```

   你应该看到 `Be.D.D. 0.4.0`（或更新版本），以及它驱动的游戏和 LeviLamina 版本。

::: details 不用安装程序
同一发布中的 `bedd-windows-x64.zip` 解压到任何位置都能用：在其文件夹中运行 `BeDD.exe`。`bedd-windows-x64.msi` 可以用 `msiexec /i bedd-windows-x64.msi /qn` 静默安装，适合受管理的电脑和 CI。
:::

## 3. 在后台启动游戏

```powershell
BeDD.exe launch --slot 1 --json
```

`launch` 一次完成所有工作：

1. 它为基础实例创建一个**克隆**，命名为 `<游戏版本>-<槽位>`，例如 `1.26.60.05-1`。克隆有自己的 `mods\`、存档、设置和日志；游戏文件是指向基础实例的硬链接，几乎不占空间。
2. 它把 Be.D.D. 模组装进克隆。
3. 它在后台启动游戏，打开**管理窗口**，等游戏准备好后输出一行 JSON 并退出。游戏继续运行。

你应该看到类似这样的一行：

```json
{"pid":12345,"instance":"1.26.60.05-1","instanceDir":"…","url":"ws://127.0.0.1:53021/v1","token":"9f3c…","label":"…"}
```

以及显示着游戏的管理窗口。脚本通过 `url` 和 `token` 与游戏通信：每个游戏在 `127.0.0.1` 上提供一个 WebSocket，令牌在每次启动时都会更换。

`BeDD.exe ps` 随时列出正在运行的游戏。

## 4. 编写你的第一个脚本

脚本每条消息发送一个 JSON 请求，例如 `{"id": 1, "op": "ping"}`，游戏处理完后回复一条带有相同 `id` 的消息。新建一个文件夹，在其中创建文件 `hello-bedd.mjs`：

```js
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

// 找到游戏：`BeDD.exe ps --json` 列出每个运行中的游戏及其 url 和 token。
const games = JSON.parse(execFileSync('BeDD.exe', ['ps', '--json'], { encoding: 'utf8' }));
const game = games.find((g) => g.kind === 'client' && g.status === 'ready');
if (!game) throw new Error('No game runs: start one with BeDD.exe launch --slot 1');

// 连接，并用 call(op, fields) 发送请求：它会以回复作为结果。
const ws = new WebSocket(`${game.url}?token=${game.token}`);
const waiting = new Map();
let nextId = 1;
ws.onmessage = (event) => {
  if (typeof event.data !== 'string') return; // 二进制帧是数据包，不是回复
  const reply = JSON.parse(event.data);
  waiting.get(reply.id)?.(reply);
  waiting.delete(reply.id);
};
const call = (op, fields = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  waiting.set(id, (r) => (r.ok ? resolve(r) : reject(new Error(`${op}: ${r.error}`))));
  ws.send(JSON.stringify({ id, op, ...fields }));
});
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

// 1. 这个游戏能做什么？
const ping = await call('ping');
console.log('instance:', game.instance, '| default mode:', ping.defaultMode);

// 2. 把最前面的界面读成文字。
const { view } = await call('ui');
console.log(view);

// 3. 截图。窗口隐藏时也能截。
const shot = await call('screenshot', { format: 'png' });
writeFileSync('screen.png', Buffer.from(shot.data, 'base64'));
console.log(`saved screen.png (${shot.width}x${shot.height})`);

ws.close();
```

运行它：

```powershell
node hello-bedd.mjs
```

你应该看到实例名、`default mode: bedboo`，以及以文字表示的标题界面，大致如下：

```text
screen start_screen
- button "Play" [e1]
- button "Settings" [e2]
- text "v26.60/LeviLamina-26.60.5"
```

脚本旁边还会出现文件 `screen.png`，内容是标题界面。控件后面的 `[e1]` 是它的 **ref**：`call('ui', { action: 'click', ref: 'e1' })` 就会点击 **Play**。

## 5. 停止游戏

```powershell
BeDD.exe stop 1.26.60.05-1
```

请使用 `launch` 输出的实例名。你应该看到 `stopped 1.26.60.05-1 (pid …)`，游戏也从管理窗口中消失。在管理窗口中关闭它也可以。

克隆会保留到下次：`BeDD.exe launch --slot 1` 几秒内就能再次启动它。`--slot 2` 会创建第二个克隆，让两个游戏并排运行。

## 你现在有了什么

- 已安装的 Be.D.D.，以及一个在后台运行的 Minecraft 1.26.60 克隆。
- 一个脚本，能找到运行中的游戏，通过 WebSocket 与它通信，读取界面并截图。

## 下一步

- 该用哪种方式驱动游戏以及原因：先用 bedboo 操作，再用 UI 树，最后才模拟输入：[操作模式](https://levimc.org/zh-Hans/BeDD/guide/operation-modes.html)。
- 用 mineflayer 风格的机器人移动、转视角、使用物品和战斗：[你的第一个 bedboo 机器人](first-bedboo-bot.md)，然后看 bedboo 的 [驱动真实客户端（BeDD）](https://levimc.org/zh-Hans/bedboo/guide/bedd.html)。
- 读取和点击菜单：[UI 控件树](https://levimc.org/zh-Hans/BeDD/reference/ui.html)。每个请求及其字段：[WebSocket 接口](https://levimc.org/zh-Hans/BeDD/reference/websocket.html)。
- 同时运行多个游戏，以及管理窗口：[多开](https://levimc.org/zh-Hans/BeDD/guide/several-games.html)。
- 让客户端与专用服务器一起测试：[世界在哪里运行](https://levimc.org/zh-Hans/BeDD/guide/modes.html)。
- 模组的设置，例如窗口大小：[配置](https://levimc.org/zh-Hans/BeDD/guide/configuration.html)。
- 遇到问题：[常见问题](https://levimc.org/zh-Hans/BeDD/guide/troubleshooting.html)。
