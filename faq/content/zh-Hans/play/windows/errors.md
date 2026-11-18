# Windows 版 LeviLauncher 的报错与崩溃

## 在 LeviLauncher（PC）中使用 BetterRenderDragon（更好的渲染龙）后游戏闪退、白屏、不生效或进世界画面异常，怎么排查？

BetterRenderDragon 是第三方 preload 类模组（目前由 QYCottage 分支维护：<https://github.com/QYCottage/BetterRenderDragon/releases>），启动器不再内置，需要作为模组自行导入。排查顺序：

1. 确认 BetterRenderDragon 版本与游戏版本对应（Release 说明里写有适配的游戏版本）。
2. 版本对应仍一启动就闪退时，改用 no-imgui 版本（没有左上角 UI），多数闪退可解决；A 卡（AMD）和部分 N 卡设备存在兼容问题。
3. 与其他模组冲突：已知小地图 mod、4dskin、BetterResourcePackManager 等与它同时使用可能崩溃或不生效，逐个禁用排查；同时查看启动器日志。
4. 白屏/画面异常：关闭显卡驱动的帧生成/AI 帧生成、驱动叠加层等任何修改游戏画面的程序。
5. 进世界画面异常还可能是光影包未适配当前游戏版本，或误用了安卓版光影，需要换用适配当前版本的 Windows 版渲染龙光影包。

*适用版本：LeviLauncher 1.0.0 及以上（PC）。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 的“注册到系统”有什么用？注册失败（无法注册 appx）怎么解决？

注册就是把启动器安装的版本注册为系统中的 Minecraft 应用包（会替换当前注册的微软商店版本）。部分没有自定义版本检测的客户端（如 Onix）需要在已注册的版本上运行，双击 `.mcpack` 导入等也需要已注册的版本。

注册失败最常见的原因是没有开启 Windows 开发者模式（报 `ERR_DEV_MODE_REQUIRED` / `ERR_UWP_DEVELOPER_MODE`，或 `0x80073CFF` 等）：在 Windows 设置 > 系统 > 开发者选项中打开「开发者模式」后重试，也可以运行 `LeviLauncher.exe doctor --fix developer-mode`。

若报 `ERR_UWP_PACKAGE_CONFLICT`，说明有启动器以外的 Minecraft 安装（如其他启动器注册的版本）占用了注册，需要先卸载或取消那个注册。

新版的注册失败弹窗会列出可能原因，并有打开日志文件夹的按钮；已注册的实例可以用 `LeviLauncher.exe instance unregister` 取消注册。新版不再需要安装 Microsoft GDK 开发套件。不要直接双击安装出的游戏文件，应通过启动器启动。

*适用版本：LeviLauncher（Windows）1.1.0 及以上*

## Windows 版 LeviLauncher 安装游戏后（没装任何 mod）点启动就报 `ERR_LAUNCH_GAME` 或无法启动，换版本也一样，怎么办？需要哪些依赖？

适用于 GDK 版基岩版；`doctor` / `self-update` 命令为 1.1.0 现行 CLI。按顺序排查：

1. 先确认 LeviLauncher 是最新版（启动器自带自更新，也可执行 `LeviLauncher.exe self-update`），旧版启动器出错无需重装，更新即可。
2. 运行 `LeviLauncher.exe doctor` 检查依赖：Visual C++ 运行库、GameInput、Gaming Services（GDK 版必需）等；`LeviLauncher.exe doctor --fix` 可自动修复 VC 运行库和 GameInput（需管理员确认），Gaming Services 需从微软商店安装（<ms-windows-store://pdp/?ProductId=9MWPM2CQNLHN>）。
3. 最常见的解决办法：先通过微软商店 / Xbox App 安装一次原版基岩版并成功启动一次（商店会自动拉取 Xbox App、Gaming Services 等依赖，之后可卸载商店版），同时在商店里更新 Xbox App；重装系统后常见此问题。
4. LTSC/精简版系统可能缺少微软商店和 Gaming Services，可参考 <https://www.mcappx.com/help/gdk-install/#windows> 手动安装 Gaming Services，装好后联网重启。
5. 开代理时微软商店可能卡住，可关代理或把含 `microsoft`、`bing` 的域名设为直连。
6. 仍不行可删除该实例重新下载安装；用 `LeviLauncher.exe play -v` 查看详细日志后带日志到 GitHub Issues 反馈。

只装 DirectX、.NET Framework 不能解决该问题。

*适用版本：LeviLauncher（Windows）1.x*

## LeviLauncher 启动 GDK 版 Minecraft 时提示缺少 Gaming Services（游戏服务）或检测失败，微软商店装不上或系统是 LTSC 没有商店，怎么办？

适用于 GDK 版基岩版。

1. 确认是否已安装：在 PowerShell（不是 cmd）执行 `Get-AppxPackage -Name Microsoft.GamingServices`，有输出即已安装；也可运行 `LeviLauncher.exe doctor` 查看 `gaming-services` 检查结果。GDK 版运行需要 VC 运行库 + GameInput + Xbox 应用 + Gaming Services。
2. 未安装时按启动器弹出的引导安装，或从微软商店安装 Gaming Services（<ms-windows-store://pdp/?ProductId=9MWPM2CQNLHN>）。
3. LTSC/精简版系统缺 Microsoft Store、App Installer、Xbox 组件：可在 <https://store.rg-adguard.net/> 粘贴商店应用链接下载 appx/msixbundle，用 PowerShell 的 `Add-AppxPackage` 安装；或从 MCAPPX 下载 Xbox Gaming Services 等组件（<https://www.mcappx.com/download/xbox-gaming-services/>，教程 <https://www.mcappx.com/help/gdk-install/#windows>），缺啥补啥；LTSC 上 Xbox 相关服务默认禁用，需在“服务”中设为自动。新手更建议换完整版 Windows。
4. 系统组件异常可执行 `sfc /scannow`。
5. 确认已安装但启动器仍误报时，可在提示中选择忽略继续启动（该检测不再强制退出）；只使用 UWP 实例时启动器不会检查 Gaming Services。

*适用版本：LeviLauncher（Windows）1.x*

## PC 版 LeviLauncher 双击后闪退或没反应（界面出现前就退出，任务管理器里也没有进程），怎么排查？

日志路径自 v1.1.0 起变更。排查步骤：

1. 运行库：启动器启动时会检测 Visual C++ 2015-2022 x64 运行库和 WebView2 Runtime，缺失时会弹窗提示下载安装。若检测通过仍闪退，多数是运行库损坏或版本过旧：安装最新 VC++ x64（<https://aka.ms/vc14/vc_redist.x64.exe>），并重新下载安装 Microsoft Edge WebView2 Runtime（实际案例中 WebView2 安装程序提示“已安装”但只是注册表残留，重装后解决）。不要删除 Edge/WebView2。
2. 日志：界面出现前失败时会写入 `%LOCALAPPDATA%\LeviLauncher\Logs\startup.log`（v1.1.0 之前的旧版在 `%APPDATA%\levilauncher.exe\logs\startup.log`），求助或提 Issue 时直接发该文件而不是截图。
3. 调试输出：在命令行运行 `LeviLauncher.exe --debug`（也接受 `/debug`、`-debug`），或在快捷方式“目标”末尾加 ` /debug`，可看到控制台输出。
4. 不依赖 WebView2 的命令行自检（v1.1.0 起）：`LeviLauncher.exe doctor`（检查 VC++ 运行库、GameInput、Gaming Services、WebView2 等），`LeviLauncher.exe doctor --fix vcruntime` 可修复运行库。
5. 以上无效时，有用户通过 DirectX 修复工具“检测并修复”运行库，或在管理员 CMD 中把 EventLog / 任务计划（schedule）服务设为自动并重启后解决（个例，仅供参考）。

*适用版本：LeviLauncher（Windows）1.1.0*

## LeviLauncher 下载完 Minecraft 后点“安装”启动器就闪退（版本文件夹已创建但为空），怎么解决？

大概率是系统缺少或损坏 Visual C++ 2015-2022 x64 运行库。下载安装最新版 <https://aka.ms/vs/17/release/vc_redist.x64.exe>（或 <https://aka.ms/vc14/vc_redist.x64.exe>）后重试即可。

新版启动器启动时会检测 VC++ 运行库并提示安装，v1.1.0 起也可以用 `LeviLauncher.exe doctor` 检查、`LeviLauncher.exe doctor --fix vcruntime` 修复。其他报错弹窗提示类似问题时也优先检查 VC++ 运行库。

## 很久没玩后，LeviLauncher 里的 MC 版本全部启动即闪退（没有日志、控制台一闪而过），但官方方式启动正常，怎么办？

先用微软商店/官方方式启动一次 Minecraft（商店下载不了时可安装一个官方 appx 包启动一次），再用 LeviLauncher 启动即可恢复。

开发者分析：启动器为阻止 GDK 版自动迁移（并删除）UWP 数据，拦截了游戏对 LocalAppData 的读取，而 MC 在 LocalAppData 保存了类似登录 token 的数据，长时间未登录需要刷新时找不到就闪退，与是否开启版本隔离无关。当前版本仍拦截 LocalAppData。

若仍不行，检查 Gaming Services（游戏服务）是否损坏：卸载/删除 Gaming Services 后重启电脑，再从微软商店重装；可用 `LeviLauncher.exe doctor` 检查 Gaming Services 状态。此类问题无日志时可给 MC 挂 VS 调试器排查。

*适用版本：LeviLauncher（Windows）0.3.x 起。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher（PC）游戏崩溃后，崩溃日志在哪里找？

适用于当前 LeviLamina 客户端。装了 LeviLamina 的游戏，崩溃日志在该游戏版本（实例）目录下的 `logs/crash` 里，文件名是 `trace_<时间>.log` 和 `minidump_<时间>.dmp`；同一目录 `logs` 下还有 `latest.log`。这不是 MC 自己的崩溃目录。反馈问题时请发最新的 trace 和 minidump。

启动器自身的日志在 `%LOCALAPPDATA%\LeviLauncher\Logs`（启动器还没显示界面就退出时，看其中的 `startup.log`），出错对话框里也有打开日志文件夹的按钮。

*适用版本：LeviLauncher 1.1.0*

## PC 版 LeviLauncher 启动 MC 时报错（看起来像要求正版），或启动后立即崩溃，怎么处理？

适用于 GDK 实例。这不是强制正版检测。先检查 Xbox 游戏服务（Gaming Services）、GameInput、Visual C++ 运行库等系统组件是否正常：GDK 版本必须有 Gaming Services，缺失或损坏时按启动器的引导去 Microsoft Store 安装或修复，必要时从 Xbox App / 微软商店装一次官方 MC 并启动一次。

也可以运行 `LeviLauncher.exe doctor` 统一检查，`doctor --fix` 能修复 VC 运行库、GameInput 等（Gaming Services 要按提示去商店页安装）。如果组件都正常但一开游戏就崩，还要检查显卡驱动，有用户反馈重装 GPU 驱动后恢复正常。

*适用版本：LeviLauncher 1.x*

## 使用 LeviLauncher 时弹出缺失 dll / 文件缺失的错误，更新 vcredist 后仍然进不去，怎么办？

通常是系统缺少 Visual C++ 运行库。现在的启动器会检测 VC 运行库，缺失时会弹窗提示，确认后从 <https://aka.ms/vc14/vc_redist.x64.exe> 下载并运行安装程序；也可以手动安装，或者运行 `LeviLauncher.exe doctor --fix vcruntime`。

还是不行的话，从微软商店装一遍原版 Minecraft，商店会补全游戏需要的系统库。如果商店版也运行不了，就是系统本身缺库或文件损坏（比如非官方精简系统镜像），需要修复或重装系统。

*适用版本：LeviLauncher 1.x*

## 在 LeviLauncher 中装了某个 mod（如去除 OreUI 的 mod）后游戏闪退，怎么回事？

是否出现该问题取决于具体的第三方 mod。先检查 mod 列表，同一个 mod 的新旧多个版本同时启用会导致闪退，关掉旧版本就行；另外要确认启动器是从官方渠道（GitHub Releases / 官网）下载的，不是来路不明的修改版。

还有问题的话，附上崩溃日志（实例目录下的 `logs/crash`）和复现视频去反馈。

*未能从源码或文档中直接证实，仅供参考。*

## 用 LeviLauncher 安装游戏后提示存储不足，存档、模组丢失（开启了版本隔离），曾安装过 BedrockBoot，是什么原因？

适用于同时使用 BedrockBoot 等会创建软链接的第三方工具时。检查 `%APPDATA%` 下的 Minecraft Bedrock 目录。这个案例里，该目录被 BedrockBoot 做成了软链接，跟 LeviLauncher 的版本隔离冲突。

可以在 BedrockBoot 设置里关掉它的版本隔离，或者卸载 BedrockBoot、删掉软链接后再试。改动前先备份存档。

*未能从源码或文档中直接证实，仅供参考。*

## 通过 LeviLauncher 安装的基岩版（GDK 版）从开始菜单、快捷方式或启动器都无法启动，任务管理器里进程卡住，怎么办？

适用于 GDK 实例。GDK 版基岩版依赖 Microsoft Gaming Services（Xbox 游戏服务）正常运行，游戏服务缺失或损坏时就无法启动。到 Microsoft Store 更新/重装 Gaming Services 后即可恢复。

可用启动器的引导检查，或在命令行运行 `LeviLauncher.exe doctor` 检查 Gaming Services、GameInput、VC 运行库等（Gaming Services 需按提示到 Store 页面安装）。

*适用版本：LeviLauncher 所有版本*
