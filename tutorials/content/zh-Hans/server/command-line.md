# 用命令行开服

学完这篇教程，你会用三步 `lip` 操作装好、启动并停止一个带 LeviLamina 的 Minecraft 基岩版专用服务器：`lip setup`、`lip run` 和 `Ctrl+C`。你还会让它在关掉终端后继续运行。写脚本、通过 SSH 管理远程机器，或者比起[开你的第一个服务器](first-server.md)里的界面更喜欢命令的话，就用这种方式。

## 你需要准备

- 已经安装好的 `lip`：见[开你的第一个服务器](first-server.md#_1-安装-lip)的第 1 步。`lip -v` 应当能输出版本号。
- Windows 10、Windows 11 或 Windows Server 2019 及更高版本；或者 x64 的 Linux、macOS，`lip` 会在那里用自带的 Wine 运行 Windows 服务器。
- 网络连接。

## 1. 为服务器建一个文件夹

`lip` 的每条命令都作用于你当前所在的文件夹，`lip` 把它叫作**工作区**。建一个文件夹并进入它：

::: code-group

```powershell [Windows]
mkdir D:\servers\survival
cd D:\servers\survival
```

```shell [Linux 和 macOS]
mkdir -p ~/servers/survival
cd ~/servers/survival
```

:::

## 2. 安装服务器

1. 选一个 LeviLamina 支持的游戏版本，例如 `1.26.60`，先看看 `lip` 会做什么：

   ```shell
   lip setup --game 1.26.60 --dry-run
   ```

   你应该看到几行以 `Dry run:` 开头的文字，列出游戏（`github.com/LiteLDev/bds`）和 LeviLamina，最后一行是 `Dry run: nothing was changed.`。如果 `lip` 说没有与这个版本相配的 LeviLamina，就换一个版本。

2. 去掉 `--dry-run`，运行同一条命令：

   ```shell
   lip setup --game 1.26.60
   ```

   这会安装游戏（基岩版专用服务器）、支持它的最新 LeviLamina，以及 LeviLamina 需要的东西。

3. `lip` 会列出《Minecraft 最终用户许可协议》和《Microsoft 隐私政策》，请你接受。读过之后，输入 `yes` 并按 `Enter`。其他任何回答都会中止命令，什么都不会改变。

4. 等待下载。第一次使用时，`lip` 可能还会安装 Microsoft Visual C++ 可再发行程序包（Windows 会请你允许），在 Linux 和 macOS 上则是 Wine。你应该看到：

   ```text
   ✓ The server is set up. Run it with 'lip run', or install mods with 'lip install'.
   ```

::: tip 让 LeviLamina 决定游戏版本
如果不在意具体版本，`lip install LeviLamina` 会安装最新的 LeviLamina，以及它支持的最新游戏。它同样会询问 EULA。
:::

::: details 在脚本或容器里
`lip` 在那里没法提问，安装会失败。如果你接受 EULA，请在命令行上说明：

```shell
lip setup --game 1.26.60 --accept-eula
```
:::

## 3. 运行服务器

1. 启动服务器：

   ```shell
   lip run
   ```

   服务器的输出会显示在你的终端里。等出现 `Server started.` 这一行。带 `[LeviLamina]` 的几行说明加载器在工作。

2. 现在你输入的内容会传给服务器。输入一条服务器命令，不用加开头的 `/`：

   ```text
   list
   ```

   你应该看到 `There are 0/10 players online:`。

3. 按 `Ctrl+C`。`lip` 向服务器输入 `stop`，服务器保存世界后退出，然后 `lip` 退出。再按一次 `Ctrl+C` 也不会强行切断服务器：`lip` 总是等它自己退出。

用普通的 `lip run` 启动的服务器，关闭终端窗口时也会停止。

## 4. 不开终端也让它运行

**托管服务器**运行在 `lip` 的后台进程里，而不是你的终端里。

1. 启动它，不接入：

   ```shell
   lip run --managed --detach
   ```

   服务器一启动，命令就返回。

2. 在同一个文件夹里，从任意终端回到它：

   ```shell
   lip run --managed
   ```

   你应该看到服务器最近输出的几行，并且可以再次输入命令。

3. 想让它继续运行，直接关闭终端窗口。`Ctrl+C` **不是**脱离：它会停止服务器，和普通的 `lip run` 一样。

4. 要停止它，按第 2 步接入，然后按 `Ctrl+C`（或输入 `stop`）。

机器重启后，托管服务器不会自己回来。需要开机自启的话，请让系统的服务管理器在工作区里运行普通的 `lip run`。

::: tip 崩溃后自动重启
`lip config set restart on-failure --workspace` 会让 `lip` 在服务器出错退出 5 秒后重新启动它。普通服务器和托管服务器都适用。
:::

## 你现在有了什么

- 一个工作区 `D:\servers\survival`（或 `~/servers/survival`），里面有游戏和 LeviLamina，版本固定为你选的版本。
- 两种运行方式：前台的 `lip run`，后台的 `lip run --managed`。

界面和命令操作的是同样的文件夹。在这个文件夹里单独运行 `lip`，服务器就出现在「服务器」页面上；在那里启动的托管服务器，和 `lip run --managed` 接入的是同一个。

## 下一步

- 装模组：[给服务器安装模组](install-mods.md)。
- 让其他玩家连进来：[让朋友连上你的服务器](let-friends-join.md)。
- 改在容器里运行服务器：[在 Docker 中运行服务器](docker.md)。
- 安装、列出、更新和卸载包：[管理包](https://levimc.org/lip/zh-Hans/guides/managing_packages.html)。
- `lip` 的设置，以及 GitHub 慢或连不上时怎么办：[配置](https://levimc.org/lip/zh-Hans/guides/configuration.html)。
- 所有选项：[`lip setup`](https://levimc.org/lip/zh-Hans/reference/commands/setup.html)、[`lip run`](https://levimc.org/lip/zh-Hans/reference/commands/run.html)、[`lip config`](https://levimc.org/lip/zh-Hans/reference/commands/config.html)。
- 命令失败时：[故障排查](https://levimc.org/lip/zh-Hans/guides/troubleshooting.html)。
