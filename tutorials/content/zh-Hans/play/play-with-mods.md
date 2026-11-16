# 在 Windows 上玩模组

学完这篇教程，你会在 Windows 上玩到装有 LeviLamina 和一个模组的 Minecraft 基岩版。它运行在 LeviLauncher 的一个实例里，世界和设置与你平时玩的游戏互不干扰。游戏版本、LeviLamina 和模组都由 LeviLauncher 帮你安装：不需要 `lip`，也不需要别的东西。

## 你需要准备

- 64 位的 Windows 10 或 Windows 11。
- 在你登录的 Microsoft 账号上购买过 Minecraft 基岩版，并且至少在这台电脑上从 Microsoft Store 安装过一次。LeviLauncher 只是管理你的游戏，不能代替游戏授权。
- 网络连接。

## 1. 安装 LeviLauncher

1. 打开 [LeviLauncher 的最新发行版](https://github.com/LiteLDev/LeviLauncher/releases/latest)，下载 `LeviLauncher-amd64-installer.exe`。如果你那里访问 GitHub 很慢，可以用[蓝奏云镜像](https://levimc.lanzoue.com/b016ke39hc)，密码为 `levi`。
2. 运行安装程序，完成安装向导。如果它提示需要安装 WebView2 或其他组件，请允许它继续。
3. 启动 LeviLauncher。你应该看到启动器的窗口，侧边栏里有**启动**、**下载**、**实例列表**、**关于**和**设置**。

## 2. 完成首次启动

1. **首次启动引导**会让你设置内容路径（LeviLauncher 存放实例的位置）和语言。把路径放在还有几 GB 空间的磁盘上，然后完成引导。
2. LeviLauncher 会检查游戏需要的组件：Microsoft Gaming Services、Microsoft GameInput，以及模组加载器需要的 Microsoft Visual C++ 运行库。缺少哪个，就按提示安装或修复它。
3. 如果 LeviLauncher 说找不到 Minecraft，请用拥有游戏的账号从 Microsoft Store 安装它，启动一次再关掉，然后回到 LeviLauncher。

LeviLauncher 不再弹出任何提示，这一步就完成了。

## 3. 安装一个带 LeviLamina 的游戏版本

1. 在侧边栏打开**下载**。
2. 选择**正式版**（Minecraft 的正式版，而不是预览版），包类型选 **GDK**。只有受支持的 GDK 版本才能自动安装 LeviLamina。
3. 选一个**加载器**一栏显示 LeviLamina 的版本。通常选其中最新的那个就对了。
4. 在安装对话框里：
   - 打开**实例隔离**，让这个实例把世界、设置和缓存保存在自己的文件夹里。
   - 打开**安装 LeviLamina**，**LeviLamina 版本**保持最新。
5. 开始安装，等它完成。

如果对话框提示“该游戏版本不支持 LeviLamina”，就回去换一个版本。

## 4. 启动游戏

1. 在侧边栏打开**启动**。
2. 选中刚安装的实例，点击**启动**。
3. 如果 LeviLauncher 报告缺少 GameInput 或 Gaming Services 等组件，按它的要求安装，然后再点**启动**。
4. Minecraft 启动了。看到标题画面后就关掉它：下一步要添加模组。

这次不带模组的启动说明实例本身没问题。之后如果出了问题，你就知道是模组造成的。

## 5. 安装模组

1. 在**启动**页面上，**内容下载**卡片可以进入 **LeviMC 模组**。打开它。这里列出的是 [LeviMC 模组](https://levimc.org/mods/zh-Hans/)中带有 Windows 客户端构建的模组。
2. 搜索 `LeviOptimize` 并打开它。
3. 点击**安装**。LeviLauncher 会选择模组的客户端构建、与你的 LeviLamina 相配的版本，以及模组需要的依赖。
4. 你应该看到“安装成功”。回到**启动**页面，实例的**模组**卡片里列出了 LeviOptimize。

要添加以文件形式拿到的模组，在**模组**卡片上点**管理模组**，再点**导入 .mcmod**。如果是 `.zip` 或单独的 `.dll`，在文件选择框里选择**所有文件 (\*.\*)**。

## 6. 带着模组游玩

1. 在**启动**页面选中这个实例，点击**启动**。
2. Minecraft 启动时会加载 LeviLamina 和 LeviOptimize。打开一个世界开始玩吧。

以后每次只添加一个模组，加完就启动一次。如果游戏启动不了，先在模组页面里禁用最新加的那个模组。

::: tip 以后更改 LeviLamina
要在已有的实例里安装、更新或移除 LeviLamina，打开**启动**按钮旁边的菜单，选择**实例设置**，进入**加载器**标签页。
:::

## 你现在有了什么

- LeviLauncher，它负责安装和启动 Minecraft 的各个版本。
- 一个隔离的实例，装有 LeviLamina 和 LeviOptimize，世界和设置与你平时玩的游戏互不干扰。

## 下一步

- 加入一个带模组的服务器，或者自己开一个：[开你的第一个服务器](../server/first-server.md)。
- 启动器模组功能的全部内容，包括 CurseForge 和内置的包管理器：[模组与集成](https://levimc.org/LeviLauncher/zh-Hans/guide/mods-integrations)。
- 重命名、删除和整理实例：[版本管理](https://levimc.org/LeviLauncher/zh-Hans/guide/version-management)。
- 世界、资源包和行为包：[内容管理](https://levimc.org/LeviLauncher/zh-Hans/guide/content-management)。
- 下载失败或游戏启动不了时：[更新与故障排查](https://levimc.org/LeviLauncher/zh-Hans/guide/update-troubleshooting)。
- Android 版 LeviLauncher 和所有发行版：[下载](https://levimc.org/LeviLauncher/zh-Hans/download)。
- 自己做一个模组：[你的第一个 LeviLamina 模组](../develop/first-levilamina-mod.md)。
