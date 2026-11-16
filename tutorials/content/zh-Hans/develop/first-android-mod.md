# 你的第一个 Android 原生模组

完成本教程后，你会拥有一个 Android 上 Minecraft 基岩版的原生模组：一个由官方模板构建的 C++ 库，打包成 `.levipack`，导入手机上的 LeviLauncher，并在游戏启动时向 Android 日志写入你自己的一行文字。这个模组还有一个可以在 LeviLauncher 中修改的设置。

第一次大约需要一小时，大部分时间花在安装 Android SDK 上。

::: info Android，而不是 LeviLamina
Android 原生模组由 [Android 版 LeviLauncher](https://levimc.org/zh-Hans/LeviLauncher/guide/mods-integrations?platform=android) 通过 Preloader SDK（[LiteLDev/preloader-android](https://github.com/LiteLDev/preloader-android)）加载，而不是由 LeviLamina 加载，并使用独立的 `pl::` API。模组的形态（`load()`、`enable()`、`disable()`、`getSelf()`）与[你的第一个 LeviLamina 模组](first-levilamina-mod.md)相同。
:::

## 你需要准备

- 一台 Windows、Linux 或 macOS 电脑，并安装以下工具：
  - [Android Studio](https://developer.android.com/studio)，或者只装它的命令行工具，用于获取 Android SDK 和 NDK；
  - [CMake](https://cmake.org/download/) 3.22 或更高版本，以及 [Ninja](https://github.com/ninja-build/ninja/releases)；
  - [PowerShell 7](https://learn.microsoft.com/zh-cn/powershell/scripting/install/installing-powershell)（在 Windows 上也可以用 Windows PowerShell）；
  - 一个面向电脑本身的 C++ 编译器：Windows 上是勾选了 **使用 C++ 的桌面开发** 的 Visual Studio，Linux 和 macOS 上是 GCC 或 Clang。构建时会在电脑上运行一个小程序，生成模组的默认配置；
  - [Git](https://git-scm.com)。
- 一部 ARM64 的 Android 手机（Android 9 或更高版本），装有 Google Play 上的 Minecraft 和 Android 版 LeviLauncher：见 [LeviLauncher](https://levimc.org/zh-Hans/LeviLauncher/)。
- 可选：[Android 平台工具](https://developer.android.com/tools/releases/platform-tools)（`adb`），并在手机上开启 USB 调试，用于查看日志。
- C++ 基础。

## 1. 安装 SDK 和 NDK

1. 在 Android Studio 中打开 **Settings** → **Languages & Frameworks** → **Android SDK**。在 **SDK Platforms** 中勾选 **Android 9.0 (API 28)**。在 **SDK Tools** 中勾选 **Show Package Details**，并在 **NDK (Side by side)** 下勾选 `28.2.13676358`。点击应用。
2. 记下页面顶部的 **Android SDK Location**，例如 `C:\Users\<you>\AppData\Local\Android\Sdk`。
3. 在新的终端中检查其他工具：

   ```powershell
   cmake --version
   ninja --version
   ```

你应该看到 3.22 或更高的 CMake 版本、一个 Ninja 版本，并且 SDK 目录中有文件夹 `ndk\28.2.13676358`。

## 2. 从模板创建仓库

1. 打开 [levilauncher-android-mod-template](https://github.com/QYCottage/levilauncher-android-mod-template)，点击 **Use this template** → **Create a new repository**，例如命名为 `my-android-mod`。
2. 克隆它：

   ```powershell
   git clone https://github.com/<you>/my-android-mod
   cd my-android-mod
   ```

3. 你应该看到 `CMakeLists.txt`、`manifest.json.in`、`scripts\package.ps1`，以及包含 `MyMod.cpp`、`MyMod.h`、`Config.h` 和 `Config.cpp` 的 `src\mod\`。

## 3. 给模组命名

打开 `CMakeLists.txt`。靠近顶部的几项设置描述了你的模组，它们会填进模组的 `manifest.json`。修改它们：

```cmake
set(MOD_ID "my_android_mod" CACHE STRING "LeviLauncher mod package directory name")
set(MOD_NAME "My Android Mod" CACHE STRING "LeviLauncher mod display name")
set(MOD_AUTHOR "<you>" CACHE STRING "LeviLauncher mod author")
set(MOD_VERSION "0.1.0" CACHE STRING "LeviLauncher mod version")
set(MOD_LIBRARY_NAME "my_android_mod" CACHE STRING "Native library name without lib prefix or .so suffix")
set(MOD_MINECRAFT_VERSIONS "[\"1.26.*\"]" CACHE STRING "Raw JSON array for manifest minecraft_versions")
```

- `MOD_ID` 是模组在手机上的目录名，也就是运行期模组 id。首次发布后请保持不变：LeviLauncher 会把它用于路径、Mod Menu 归属和用户保存的设置。
- `MOD_NAME` 是 LeviLauncher 显示的名称，也是你在 Android 日志中的标签。
- `MOD_MINECRAFT_VERSIONS` 列出模组适配的游戏版本；`*` 匹配版本的其余部分。空列表 `[]` 表示所有版本。请确保它包含你手机上的 Minecraft 版本。

模板的 C++ 命名空间和类是 `clange_me` 和 `ClangeMeMod`。你以后可以重命名它们，本教程保持不变。

## 4. 写下你的第一行

模板已经带有类型化配置：`src\mod\Config.h` 中的结构体 `ModConfig` 会保存为模组的 `config/config.json`，模组启用时会把其中的 `message` 写入日志。修改默认消息：

```cpp
struct ModConfig {
    int version = 1;
    bool enabled = true;
    std::string message = "Hello from my first Android mod!";
};
```

打开 `src\mod\MyMod.cpp` 看看它在哪里被使用。生命周期如下：

1. `load()` 在模组加载时运行。模板在这里创建数据和配置文件夹，并加载配置。
2. `enable()` 在游戏启动前运行。它用 `getSelf().getLogger().info(...)` 写出 `Config message: <message>`。
3. `disable()` 在游戏关闭时运行；`unload()` 在最终清理时运行。

`src\main.cpp` 末尾的 `PL_REGISTER_MOD` 注册了模组唯一的长期存活实例。

## 5. 构建 .levipack

设置 SDK 位置，然后为 64 位 ARM 运行打包脚本：

::: code-group

```powershell [Windows]
$env:ANDROID_HOME = "C:/Users/<you>/AppData/Local/Android/Sdk"
./scripts/package.ps1 -Abi arm64-v8a
```

```shell [Linux 和 macOS]
export ANDROID_HOME="$HOME/Android/Sdk"     # macOS：$HOME/Library/Android/sdk
pwsh ./scripts/package.ps1 -Abi arm64-v8a
```

:::

在 Windows 上，请在 **Developer PowerShell for VS** 中运行，这样 CMake 才能找到电脑上的编译器。第一次构建会下载 Preloader SDK 和几个库。

最后你应该得到文件 `build-arm64-v8a\my_android_mod-0.1.0-arm64-v8a.levipack`。`.levipack` 是一个 ZIP 文件，里面是文件夹 `my_android_mod\`，包含 `manifest.json`、`libmy_android_mod.so` 和 `config\`。

::: tip 让 GitHub 来构建
模板在 `.github\workflows\build.yml` 中带有工作流。推送后，仓库的 **Actions** 标签页会构建 `.levipack` 文件并作为构件（artifact）提供；推送 `v*` 标签还会把它们附加到发布版本上。
:::

## 6. 导入 LeviLauncher

1. 用 USB 或任何你喜欢的方式，把 `.levipack` 复制到手机的 **Download**（下载）文件夹。
2. 打开 LeviLauncher，进入「模组」，点击**扫描**。你的模组会出现，点击它旁边的**添加**。（也可以在文件管理器中打开 `.levipack`，选择用 LeviLauncher 打开。）
3. 你应该在模组列表中看到 **My Android Mod**，已启用，版本为 `0.1.0`。

## 7. 确认它在运行

1. 从 LeviLauncher 启动游戏。
2. 用 USB 连接手机，在电脑上查看 Android 日志：

   ::: code-group

   ```powershell [Windows]
   adb logcat | Select-String "My Android Mod"
   ```

   ```shell [Linux 和 macOS]
   adb logcat | grep "My Android Mod"
   ```

   :::

   你应该看到一行 `Config message: Hello from my first Android mod!`。

3. 回到 LeviLauncher，打开你的模组的详情。它现在有了配置：把 **Message** 改成别的内容并保存。再次启动游戏，日志会显示新的消息。

没有 `adb`？第 3 步依然可行：配置之所以存在，正是因为你的模组运行了 `load()` 并保存了它。

## 你现在有了什么

- 一个 Android 原生模组仓库，可以在电脑上和 GitHub 上构建出 `.levipack`。
- 已安装到 LeviLauncher 中的模组，它会写入 Android 日志，并带有用户可以修改的设置。

## 下一步

- 生命周期的细节：[Mod API](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/mod/)。
- 更多带标题、描述和取值范围的设置：[Config API](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/config/)。
- 游戏中的按钮和开关：[Mod Menu API](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/mod_menu/)。触摸和按键：[Input API](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/input/)。
- 改变游戏的行为：[Hook API](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/hook/)、[Signature API](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/signature/) 和 [Patch API](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/patch/)。
- SDK 的头文件和宏：[SDK 头文件与宏](https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/types_and_macros/)。
- 包含 Mod Menu、按钮和图片的完整示例：[LiteLDev/LeviLauncher-Android](https://github.com/LiteLDev/LeviLauncher-Android) 中的 `examples/full-cpp-mod`。
- 从玩家角度看 LeviLauncher 中的原生模组：[模组与集成](https://levimc.org/zh-Hans/LeviLauncher/guide/mods-integrations?platform=android)。
