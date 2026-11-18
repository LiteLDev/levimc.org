# lip 的报错

## lip 安装包时反复失败（下载中断、缓存损坏等），如何清理 lip 缓存？缓存在哪里？

执行 `lip cache clean` 删除 lip 的缓存后重新安装（旧命令 `lip cache purge` 已不存在）。缓存目录在 Windows 上是 `%LOCALAPPDATA%\lip\Cache`，其他系统为 `$XDG_CACHE_HOME/lip`（默认 `~/.cache/lip`），与服务端/lip 安装在哪个盘无关；在 lip 自带的界面中也可在设置页点 "Clear cache"。缓存只保存可重新下载的内容，清理不影响服务端、已装包和配置；不要在其他 lip 命令下载时清理。新版 lip 会自动替换不是有效 ZIP 的缓存文件，所以通常已很少需要手动清理。

排查失败原因请看命令输出的 error/hint，以及服务端目录 `.lip/logs/` 下的完整报告。配置项用 `lip config set <键> <值>` 设置、`lip config list` 查看（如 GitHub 代理 `github_proxy`）。

*适用版本：lip 0.41.x*

## 用 lip（或 LeviLauncher 内置的 lip）安装/更新 LeviLamina 或模组时报依赖解析失败（旧版提示 `Cannot find a valid state to satisfy all dependencies.`，启动器里显示 `ERR_LIP_INSTALL_FAILED`），是什么原因？

这是依赖解析失败：找不到一组能同时满足所有已安装/要安装的包依赖范围的版本。最常见的原因是已安装的某些模组只声明支持旧版 LeviLamina/游戏版本（例如某 mod 只匹配 LeviLamina 26.51.x），还没适配新版本。新版 lip 的报错为 `Cannot find versions of the packages that work together:`，并逐条列出冲突原因和 hint，详细信息见工作区 `.lip/logs/` 下的失败报告。

解决办法：等相关模组发布适配新版本的版本，或先卸载这些模组（`lip uninstall <包>`）再升级。命令行下更换游戏/LeviLamina 版本应使用 `lip setup --game <版本>`，它会列出无法配合新版本的模组并询问是否卸载它们；`lip install`/`lip update` 不会改动游戏和加载器，无法满足时会提示改用 `lip setup`。

*适用版本：lip 0.40 及以上（含 0.41.1）；LeviLauncher 1.1.x 内置 lip*

## 用 lip 安装/更新 LeviLamina 或插件时失败（下载/解压报错、进度卡住、缓存读取出错、依赖不满足等），怎么办？

多数是 lip 缓存损坏、lip 版本过旧或访问 GitHub 的网络问题：

1. 执行 `lip cache clean` 清空缓存后重试（执行时不要有其他 lip 命令在运行）。缓存目录：Windows 为 `%LOCALAPPDATA%\lip\Cache`，Linux/macOS 为 `~/.cache/lip`；清缓存不影响工作区、已装的包和配置。
2. 执行 `lip self-update` 把 lip 更新到最新版，旧版 lip 无法安装新格式的包。
3. 访问 GitHub 困难时配置 GitHub 代理：`lip config set github_proxy <代理地址>`；配置有问题时用 `lip config delete github_proxy` 重置。普通 HTTP 代理无需专门配置，lip 会使用终端里的 `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` 环境变量或系统代理。
4. 安装 LeviLamina 请用 `lip install LeviLamina`（或 `lip setup`），让 lip 自动选择 LeviLamina 支持的游戏版本，不要指定 LeviLamina 尚未适配的 BDS 版本；新建服务器建议在空文件夹中进行。
5. 失败时 lip 会在工作区 `.lip/logs/` 下写失败报告，可据此排查或反馈。

lipui 早已不再维护，直接在终端输入 `lip`（不带参数）即可打开 lip 自带的界面。

*适用版本：lip 0.41.x（当前版本）*

## `lip install` 时包名带 `https://` 前缀（如 `https://github.com/...`）安装失败，怎么办？

Git 仓库形式的包标识不要写协议前缀，把 `https://` 去掉，并检查路径大小写/拼写，例如 `lip install github.com/LiteLDev/LegacyScriptEngine`。在 lip 中以 `https://` 开头的参数会被当作“ZIP 压缩包的下载地址”，仓库网页地址不是 ZIP，因此会失败。

## lip 执行报错，但环境变量正常，服务器目录路径中含有“×”之类的特殊符号，是什么原因？

路径中的特殊符号可能导致 lip（或其调用的程序）出错。把服务器所在目录改成不含特殊符号（最好也不含中文、空格）的路径后再运行。

*适用版本：旧版 lip 报告；新版未确认。未能从源码或文档中直接证实，仅供参考。*

## 在 LeviLauncher 中右键更新已安装的 mod（显示有新版本）时报 `ERR_NO_UPDATE_SOURCE`（没有可用的更新源），怎么办？

`ERR_NO_UPDATE_SOURCE` 是 LeviLauncher 自己给出的错误：启动器无法把该已安装 mod 唯一地对应到模组目录中的某个 lip 包（没有匹配到，或按名称匹配到多个包），或者没有可用的目标版本，因此不知道从哪里更新。可先把 LeviLauncher 更新到最新版本；临时办法是到启动器的 LeviMC 模组（模组目录）页面里找到该 mod，直接重新安装新版本。

*适用版本：LeviLauncher（含 1.1.0 内置 lip 兼容包管理器）*

## 在 LeviLauncher 里更新 mod（如 Lamium）时报错，大意是 lip 连不上 GitHub，怎么办？

mod 的包和文件托管在 GitHub 上，需要能访问 GitHub。可以：

1. 开启系统代理后重试（LeviLauncher 在 Windows 上会读取系统/WinHTTP 代理设置）。
2. 在启动器「设置」的 lip 部分配置「GitHub 代理」（可选预设如 <https://gh-proxy.org/https://github.com>，也可手填，留空恢复默认），或用 `lip config set github_proxy <URL>` 设置 lip 的 GitHub 代理，启动器在未单独设置时会读取 lip 的 `config.toml` 中的 `github_proxy`。

*适用版本：LeviLauncher 1.1.0；lip 0.40 及以上*

## 用 lip 安装 LeviLamina 时报错无法获取依赖（如获取不到 PreLoader 等依赖包）怎么办？

多半是访问 GitHub 失败。先看 lip 输出的 `error:`/`hint:` 行和 `.lip/logs/` 下的失败报告判断原因。GitHub 慢或被墙时：设置 GitHub 代理 `lip config set github_proxy <代理地址>`（该代理必须支持 git 仓库），或使用网络代理——lip 会读取终端的 `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` 环境变量，未设置时使用系统代理（例如 PowerShell 中 `$env:HTTPS_PROXY = "http://127.0.0.1:7890"` 后再执行 `lip install`）。若怀疑下载缓存损坏，可执行 `lip cache clean` 清理缓存后重试（不要在其他 lip 命令下载时清理）。

*适用版本：lip 0.40 及以上（新版 C# lip）*

## 用 lip 安装 LeviLamina 时执行 `.\PeEditor.exe -mb` 失败，返回退出码 `-1073741515`（例如旧版报 `CliWrap.Exceptions.CommandExecutionException ... Command: cmd.exe /c ".\PeEditor.exe -mb"`），怎么解决？

退出码 `-1073741515`（`0xC0000135`）表示缺少依赖 DLL，通常是没有安装 Microsoft Visual C++ 运行库（x64）。新版 lip 在 `lip setup`/安装 Windows 服务端时会检测并自动安装 VC++ 运行库（需要在 UAC 弹窗中允许以管理员身份运行）；如果拒绝了 UAC 或自动安装失败，请手动从 <https://aka.ms/vc14/vc_redist.x64.exe> 下载安装，然后重新执行 `lip install`。

`PeEditor` 是 LeviLamina 包的 `post_install` hook，失败时新版 lip 会提示「A hook command of a package failed」，详细输出见 `.lip/logs/` 下的失败报告。

*适用版本：当前版本（Windows 服务端）*
