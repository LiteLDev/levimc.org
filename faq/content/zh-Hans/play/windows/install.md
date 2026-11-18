# 安装与更新 Windows 版 LeviLauncher

## LeviLamina 已发布新的客户端版本，但 LeviLauncher 里刷新后迟迟看不到，怎么办？

新版本发布后要先等 CI 编译完成，并写入版本库 `levilamina-client-version-db`，启动器才能看到。启动器从 GitHub（`raw.githubusercontent.com`）读取这个版本库；开启“使用镜像源”时，会先经过 `gh-proxy.org` / `gh.bibk.top` 代理。这些来源都有缓存，所以新版本通常要过几分钟才出现。等一会儿再重启启动器或刷新即可。命令行 `LeviLauncher.exe loader versions` / `loader install` 读的是同一个版本库，在版本库更新前同样装不到新版本。

*适用版本：LeviLauncher 1.1.x（Windows 版）*

## 在 PC 版 LeviLauncher 里下载 Minecraft 版本很慢，必须挂代理吗？

不需要。下载时选择国内的 xboxlive.cn 下载源（启动器会把 xboxlive.cn 镜像排在前面，也可以让启动器自动测速选源）；如果还是慢就换一个下载源。中国大陆用户默认开启的“使用镜像源”也会让启动器更新、软件包和版本列表走国内镜像/GitHub 代理。

*适用版本：LeviLauncher (Windows) 1.0.x 及以上*

## 微软商店版 Minecraft 被强制/自动更新到新版本，想继续用旧版本（如与 LeviLamina 对应的版本）怎么办？

先关闭 Microsoft Store 的自动更新，然后用 LeviLauncher 下载安装并启动指定版本的 Minecraft 基岩版（GDK/UWP 均可，可开启版本隔离）。安装页的“安装 LeviLamina”开关默认开启（仅对 LeviLamina 支持的游戏版本生效），可直接安装对应 LeviLamina。

*适用版本：LeviLauncher（Windows）当前版本；需正版 Minecraft 基岩版*

## LeviLauncher 1.1.0-beta.3 等旧版本自动更新时无法下载更新包，是电脑问题还是启动器问题？

是启动器的问题：旧版启动器使用的更新地址（GoProxy 模块镜像）上没有新版更新包。请直接去 GitHub Releases（或蓝奏云镜像 <https://levimc.lanzoue.com/b016ke39hc>，密码 `levi`）手动下载最新版安装。新版启动器改为从 GitHub Release 的 `LeviLauncher.zip` 自更新（开启镜像源时先尝试 `gh-proxy.org` 镜像），之后自动更新可以正常工作。

*适用版本：LeviLauncher v1.1.0-beta.4 之前的版本需手动更新；v1.1.0 正式版起自更新正常*

## LeviLauncher PC 版 GitHub Release 里有好几个文件，有什么区别、该下载哪个？下载慢怎么办？

推荐下载 `LeviLauncher-amd64-installer.exe`（安装版），运行后按安装界面安装，路径建议选不含中文的独立目录（不要放进 Minecraft 游戏目录）。`LeviLauncher.exe` 是便携版，单独放进一个新建的英文路径文件夹即可直接运行；`LeviLauncher.zip` 是启动器自更新使用的更新包，一般不需要手动下载。GitHub 下载慢时可以使用官方蓝奏云镜像 <https://levimc.lanzoue.com/b016ke39hc>（密码 `levi`）。

*适用版本：LeviLauncher（Windows）v1.1.0*

## LeviLauncher（Windows）下载/安装游戏版本时提示“当前账户没有此版本的授权”（`ERR_LICENSE_NOT_ENTITLED`），怎么办？

LeviLauncher 需要正版 Minecraft 基岩版授权：在启动器中登录的微软账号必须拥有基岩版（没有可到 <https://www.xbox.com/en-US/games/store/minecraft/9nblggh537bl> 购买），只在游戏里登录过 Xbox 但没买过 PC 基岩版是不行的。已购买仍报错时：一个微软账户最多只能在 10 台设备上登录微软商店，启动器会被算作一台单独的设备，请到 <https://account.microsoft.com/devices/content> 移除不需要的设备，并确认购买在当前登录的账号上，然后重试。其他安装/启动问题请参考官方故障排查文档：<https://levimc.org/zh-Hans/LeviLauncher/guide/update-troubleshooting>。

*适用版本：LeviLauncher（Windows）1.0.0 及以上（启动器内微软账号登录）*

## LeviLauncher 下载游戏版本或其他内容一直失败（网络错误），换网络、开代理都不行，怎么排查？启动器日志在哪？

基本都是网络问题。先重试几次；在「下载」页切换/测速镜像，或改用本地安装包导入；中国大陆用户可在设置中开启「使用镜像源」。如果使用代理，启动器会读取 Windows 系统代理（包括 PAC/自动配置脚本），代理软件需开启系统代理；仍不行可用代理软件的 TUN（虚拟网卡）模式接管全部流量（有用户以此解决）。启动器日志在 `%LOCALAPPDATA%\LeviLauncher\Logs`（启动阶段的 `startup.log` 也在此），报错弹窗里也有“打开日志文件夹”按钮；反馈问题时请附上日志。

*适用版本：LeviLauncher（Windows）1.1.0 及以上（日志路径）；网络建议适用当前所有版本*

## 在 LeviLauncher 中给实例安装 LeviLamina 一直失败或卡在 Resolving，报 `ERR_LIP_INSTALL_FAILED`（`context deadline exceeded`、HTTP 404/500/504、连接 `127.0.0.1:443` 失败等），怎么解决？

基本都是访问 GitHub 的网络问题。

1. 在启动器设置「包管理」中开启「使用镜像源」，在「GitHub 代理」里选一个预设（默认 <https://gh-proxy.org/https://github.com>，另有 v4/v6/cdn/axisnow.gh-proxy.org、ghproxy.vip、gh.bibk.top 等，均为 `https://<主机>/https://github.com` 形式），或选「自定义」填写其他镜像。自定义这类镜像时建议写完整前缀（如 <https://v6.gh-proxy.org/https://github.com>），只填主机名时启动器会自动补上 `/https://github.com`。不同镜像在不同地区速度差别大，失败就多换几个。留空可恢复默认值。
2. 修改后用「清理缓存」删除已下载的软件包文件再重试。安装需要一些时间（约一分钟），不是立刻完成。
3. 不开镜像源时直连 GitHub，会经过系统代理：若日志显示在连 `127.0.0.1:xxx` 而你没开代理，说明有残留的系统代理设置，到 Windows 设置中搜索“代理”关闭，或把代理软件开一次再关一次；反之需要代理时请开启代理软件的系统代理。
4. 也可多重试几次或换 DNS（如阿里 DoH）。
5. 只想先装游戏时，可在安装页关闭「安装 LeviLamina」开关，之后再装。

*适用版本：LeviLauncher（Windows）1.1.0 及以上*

## LeviLauncher（Windows）安装或启动版本时提示缺少组件或无法启动，是环境问题吗？

多数是环境问题。LeviLauncher 和 LeviLamina 都需要正版基岩版授权；此外需要：

- Microsoft Edge WebView2 Runtime；
- GDK 版需要 Microsoft Gaming Services 与 Microsoft GameInput；
- UWP 版需要 Windows 开发者模式；
- 使用 LeviLamina/原生模组需要 Visual C++ 运行库 x64（<https://aka.ms/vs/17/release/vc_redist.x64.exe>）。

启动器会检查并提示安装缺失组件，也可以运行 `LeviLauncher.exe doctor` 检查、`LeviLauncher.exe doctor --fix` 修复（`vcruntime`、`gameinput`、`developer-mode` 等）。

*适用版本：LeviLauncher（Windows）1.1.0 及以上*

## 拿到 `.levipack` 格式的模组文件怎么装？PC 版 LeviLauncher 能用安卓的 `.levipack` 吗？

`.levipack` 是 LeviLauncher-Android（安卓版）的模组包格式，只能在安卓版里导入（直接用安卓版打开或分享给它即可）。PC 和安卓的模组不互通：安卓模组是 arm64 的 `.so`（文件名常带 `android-arm64`），不能在 PC 上使用。

PC 版（Windows）LeviLauncher 使用的模组格式是 `.mcmod` 模组包，也兼容带 `manifest.json` 的 `.zip` 包和单独的 `.dll`：在实例的模组页面把文件直接拖进启动器窗口，或点导入并在文件选择框里选“所有文件 (*.*)”即可；命令行可用 `LeviLauncher.exe mod import <文件>`。

*适用版本：LeviLauncher（Windows）1.1.0；LeviLauncher-Android 1.7.x 及当前版本*

## levilauncher.com 是 LeviLauncher / LeviMC 的官方网站吗？

不是。levilauncher.com 与 LeviMC 无关，是 AI 生成的仿冒钓鱼网站，其提供的下载文件含病毒。LeviMC 唯一官方网站是 <https://levimc.org>（LeviLauncher 文档：<https://levimc.org/zh-Hans/LeviLauncher/>）。

LeviLauncher 只应从 GitHub Releases（Windows：<https://github.com/LiteLDev/LeviLauncher/releases>，安卓：<https://github.com/LiteLDev/LeviLauncher-Android/releases>）或官方文档下载页列出的蓝奏云镜像下载。

*未能从源码或文档中直接证实，仅供参考。*

## 之前用微软官方启动器或商店装好的基岩版，能直接用 LeviLauncher 启动吗？

不建议直接接管。LeviLauncher 管理的是自己安装的“实例”，推荐在 LeviLauncher 的“下载”页面重新安装一个相同版本（也可用 `LeviLauncher.exe install <版本或本地安装包文件>`）。

存档和设置可以在安装时选择复制现有游戏数据，或之后用 `LeviLauncher.exe instance copy-data <实例> --from system` 把系统中同一通道（正式版/预览版）的原版游戏数据合并进该实例（同名文件会被覆盖，不会删除文件）。该做法适用于 GDK 版、启用独立数据（隔离）的实例。操作前仍建议先备份全部存档。

*适用版本：LeviLauncher（Windows）1.1.0*

## 安装 LeviLauncher 时弹出 Windows 管理员权限（UAC）提示，要允许吗？

要。LeviLauncher 安装程序需要管理员权限（默认安装到 `Program Files`），不允许就装不上。前提是安装包来自官方渠道（GitHub Releases 或官方文档列出的蓝奏云镜像）。

此外，启动器自更新（安装目录不可写时）以及 `doctor --fix` 安装 VC 运行库、GameInput 等组件时也可能请求管理员权限，确认可信后允许即可。

*适用版本：LeviLauncher（Windows）1.x*

## 去哪里找 Windows 版基岩版的历史版本（例如 1.26.23）？

LeviLauncher 自带历史版本库：在“下载”页面即可选择正式版/预览版的历史版本（GDK 的 msixvc 与 UWP 的 appx 都有），命令行可用 `LeviLauncher.exe installer search 1.26.2`（预览版加 `--channel preview`）查看，再 `LeviLauncher.exe install 1.26.23` 安装。

版本列表来自 GitHub（`LiteLDev/minecraft-windows-gdk-version-db`），国内可开启“使用镜像源”。第三方站点 mcappx.com 也提供 Windows 版历史安装包，下载后可作为本地包导入。

*适用版本：LeviLauncher（Windows）1.x*

## 用 LeviLauncher 下载的 Minecraft 安装包（msixvc）怎么安装？

不要手动安装 msixvc（`Add-AppxPackage` 等方式不适用），直接在 LeviLauncher 里安装：在“下载”页面选择版本并启动安装任务，已下载的安装包会被复用（未完成的下载会续传）。

也可用命令行 `LeviLauncher.exe install <版本>`，或对本地文件 `LeviLauncher.exe install D:\xxx.msixvc`（支持 `.msixvc`/`.appx`/`.msix`/`.appxbundle`/`.msixbundle`）。`LeviLauncher.exe installer list` 可查看已下载的安装包。获取版本列表需要能访问 GitHub，国内可开启“使用镜像源”。

*适用版本：LeviLauncher（Windows）1.x*

## LeviLauncher 蓝奏云下载链接的密码是什么？

密码是 `levi`。官方蓝奏云镜像地址：<https://levimc.lanzoue.com/b016ke39hc>（GitHub 下载较慢时使用），也可直接从 GitHub Releases 下载。

## LeviLauncher 安装游戏报错、模组管理点击无效或下载完无法启动，路径或文件名中带中文，怎么解决？

尝试把相关路径（启动器数据目录、实例目录、实例名/文件名）中的中文等非 ASCII 字符去掉后重试。有用户以此恢复正常。

注意 v1.1.0 已修复内置包管理器对含 `%`、`#`、非 ASCII 字符本地路径的记录问题，开启版本隔离时若隔离目录无法用系统代码页表示也会出问题，因此使用纯英文路径最稳妥。

*适用版本：LeviLauncher（Windows）。未能从源码或文档中直接证实，仅供参考。*
