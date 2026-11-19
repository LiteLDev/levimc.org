# LeviLamina

适用于基岩版专用服务器和 Windows 客户端的轻量级、模块化 Minecraft 基岩版模组加载器，LiteLoaderBDS 的后继者。

[![Discord](https://img.shields.io/discord/849252980430864384?style=for-the-badge&logo=discord)](https://discord.gg/v5R5P4vRZk)
[![Telegram](https://img.shields.io/badge/Telegram-blue?style=for-the-badge&logo=telegram)](https://t.me/LiteLoader)
[![656669024](https://img.shields.io/badge/656669024-red?style=for-the-badge&logo=qq)](https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=ndxRXO1HARA8ing7OunMClOz3cQTogL0&authKey=D7QTcqnzhBzuh3zc%2F70FjgklsVvkCImTjSRqHMwYGCLwIFpxzp%2FflC97Y7AUG%2Fpy&noverify=0&group_code=656669024)
[![937236109](https://img.shields.io/badge/937236109-red?style=for-the-badge&logo=qq)](https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=1u0nmmUIZOB716neFTlbyj_2aOQn_TV-&authKey=1lBqM20oOfdKjDnxkq09DjR729fqFfWVnaLQ7VjrDB%2FAg6qwvw6QCwdwYoRUrewU&noverify=0&group_code=937236109)
[![850517473](https://img.shields.io/badge/850517473-red?style=for-the-badge&logo=qq)](https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=3Fxt0gwMYkoLPani_vQ9tsNfYrnVy4hK&authKey=2A%2BNk3jmRaK%2FO1FBQSjTIbStAU1kbZWkjEkyh2RTVA015eTg6c4CvVhfByc1BtGZ&noverify=0&group_code=850517473)

## LeviLamina 是什么

LeviLamina 是一个非官方的 Minecraft 基岩版模组加载器。它加载到基岩版专用服务器（BDS）或 Windows 上的 Minecraft
客户端中，加载你安装的模组，并为模组提供它们所依赖的 API。它是 LiteLoaderBDS 的后继者。

- **对服主来说**，LeviLamina 是所有服务端模组的基础：把它装进服务器，再在上面安装模组。
- **对玩家来说**，LeviLamina 在 Windows 上的 Minecraft 中运行客户端模组。
- **对模组开发者来说**，LeviLamina 是模组所依赖的 C++ API（`ll::` 和游戏自身的类），在本站和
  [C++ 参考](https://levimc.org/LeviLamina/api/)中有文档。

它为模组提供：

- **全面的 API**：为用 C++ 编写的模组提供命令、表单、配置、事件、钩子、服务等接口（[按主题划分的 API](api_reference/index.md)）。
- **强大的事件系统**：订阅游戏中发生的事情，从玩家加入到方块被破坏（[事件与钩子](concepts/events_and_hooks.md)、
  [事件指南](developer_guides/how_to_guides/event_guide.md)）。
- **服务端与客户端**：在基岩版专用服务器和 Windows 上的 Minecraft 客户端中提供同一套 API，只有少数部分仅限其中一端
  （[支持的版本](versions.md)、[服务端与客户端构建](developer_guides/architecture.md)）。

## 几行代码的模组

LeviLamina 模组是一个 DLL，和它的 `manifest.json` 一起放在 `plugins/`（客户端为 `mods/`）下自己的文件夹中。它的入口是一个用
`LL_REGISTER_MOD` 注册的类：LeviLamina 加载 DLL 时调用 `load()`，游戏启动后调用 `enable()`。下面这个模组会向每个加入的玩家问好：

```cpp
#include "ll/api/event/EventBus.h"
#include "ll/api/event/player/PlayerJoinEvent.h"
#include "ll/api/mod/NativeMod.h"
#include "ll/api/mod/RegisterHelper.h"
#include "mc/world/actor/player/Player.h"

class MyMod {
public:
    static MyMod& getInstance() {
        static MyMod instance;
        return instance;
    }

    bool load() { return true; }

    bool enable() {
        ll::event::EventBus::getInstance().emplaceListener<ll::event::PlayerJoinEvent>(
            [](ll::event::PlayerJoinEvent& event) {
                ll::mod::NativeMod::current()->getLogger().info("Welcome, {}!", event.self().getRealName());
            }
        );
        return true;
    }
};

LL_REGISTER_MOD(MyMod, MyMod::getInstance());
```

[模组生命周期](concepts/mod_lifecycle.md)说明了它们各在何时运行；
[写你的第一个 LeviLamina 模组](https://levimc.org/zh-Hans/tutorials/develop/first-levilamina-mod/)会一步步带你从模板做出这样一个模组。

## 与其他项目的关系

LeviLamina 是 LeviMC 各项目的核心：

- [lip](https://levimc.org/zh-Hans/lip/) 运行 LeviLamina 服务器并管理其包：它搭建服务器、把 LeviLamina 装进服务器、
  从[模组目录](https://levimc.org/zh-Hans/mods/)安装模组，并启动服务器。
- [LegacyScriptEngine](https://levimc.org/zh-Hans/LegacyScriptEngine/) 是一个 LeviLamina 模组，运行用
  JavaScript、Lua 或 Python 编写的插件，适合不需要 C++ 的场合。
- [LeviLauncher](https://levimc.org/zh-Hans/LeviLauncher/) 是 Minecraft 客户端的启动器：它为你安装游戏版本、
  LeviLamina 和客户端模组。

## 从这里开始

刚接触 LeviLamina？教程会一步步带你从零做成一件事：

- [开你的第一个服务器](https://levimc.org/zh-Hans/tutorials/server/first-server/)：安装 lip，搭建带 LeviLamina
  的服务器并启动它。
- [在 Windows 上玩模组](https://levimc.org/zh-Hans/tutorials/play/play-with-mods/)：用 LeviLauncher 运行
  LeviLamina 和客户端模组。
- [写你的第一个 LeviLamina 模组](https://levimc.org/zh-Hans/tutorials/develop/first-levilamina-mod/)：从模板创建模组，
  构建并加载它。

[全部教程](https://levimc.org/zh-Hans/tutorials/)

## 本站内容

- **指南**：一步步使用 API 的某一部分：[事件](developer_guides/how_to_guides/event_guide.md)、
  [命令](developer_guides/how_to_guides/command_guide.md)、[表单](developer_guides/how_to_guides/form_guide.md)、
  [钩子](developer_guides/how_to_guides/hook_guide.md)、[国际化](developer_guides/how_to_guides/i18n_guide.md)、
  [协程](developer_guides/how_to_guides/coro_guide.md)等。
- **概念**：LeviLamina 如何工作：[模组生命周期](concepts/mod_lifecycle.md)、[事件与钩子](concepts/events_and_hooks.md)
  以及项目的[架构](developer_guides/architecture.md)。
- **参考**：[C++ 参考](https://levimc.org/LeviLamina/api/)（从头文件生成的所有类和函数）、附带示例的
  [按主题划分的 API](api_reference/index.md)、[Android 原生模组 API](developer_guides/android/api/mod.md)、
  [支持的版本](versions.md)和[使用准则](common_guides/usage_guidelines.md)。

有疑问？[LeviMC 问答](https://levimc.org/zh-Hans/faq/)回答服主常问的问题（安装、[错误码](https://levimc.org/zh-Hans/faq/server/levilamina/errors/)、崩溃）
和[模组开发者](https://levimc.org/zh-Hans/faq/develop/levilamina/basics/)常问的问题。

LeviLamina 是开源项目：参见它的[仓库](https://github.com/LiteLDev/LeviLamina)和
[如何参与贡献](https://github.com/LiteLDev/LeviLamina/blob/main/CONTRIBUTING.md)。

## 鸣谢

感谢[武汉旋律云网络科技有限公司](https://www.rhymc.com/)对本项目的支持  
[![Rhymc](https://www.rhymc.com/assets/img/logo.png)](https://www.rhymc.com/)
