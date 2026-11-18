# LeviLamina 模组 API：其他 API

## LeviLamina 原生 C++ mod 如何实现多语言（i18n）：语言文件放哪、如何加载、如何使用 `_tr`？

做法与 LeviLamina 本体一致：代码里硬编码英文（作为 key），再提供各语言的 json 翻译文件，随 mod 一起分发到 mod 目录下的 `lang/`（如 `lang/zh_CN.json`，内容如 `{"hello {}": "你好 {}"}`）。在 mod 的 `load()` 中调用 `ll::i18n::getInstance().load(getSelf().getLangDir())` 加载（路径为目录时读取其中所有 `.json`，文件名即语言代码；也可传单个 json 文件，此时顶层键为语言代码）。使用：

```cpp
#include "ll/api/i18n/I18n.h"
using namespace ll::i18n_literals;
int a = 114514;
"hello {}"_tr(a);
```

当默认语言（LeviLamina 配置 `language`，默认 `"system"` 跟随系统）为 `zh_CN` 且已加载 `zh_CN` 翻译时输出“你好 114514”，未找到对应翻译时原样输出“hello 114514”；也可用 `"hello {}"_trl("zh_CN", a)` 显式指定语言。`I18n.h` 中还提供 `LL_I18N_COLLECT_STRINGS` 宏用于收集代码里所有 `_tr` 字符串，便于生成翻译模板。打包时需确保 `lang` 目录被一起复制到产物中：当前模板使用 levibuildscript 的 `modpacker` 规则（旧模板的 `after_build.lua` 已移除），而 `modpacker` 只会把 dll、pdb 和 `manifest.json` 复制到 `bin/<modName>/`，不会复制 `lang` 目录，需要自己在 `xmake.lua` 里加 `after_build` 用 `os.cp` 复制，或发布时手动放入 mod 目录。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## LeviLamina 头文件里有些 `enum` 是空的、有些结构体（例如 `getIconInfo` 返回的 `ResolvedItemIconInfo`）只有构造函数没有成员，正常吗？需要自己补吗？

正常。mc 头文件由逆向自动生成。现在大部分类/结构体已经生成了成员布局：已知类型的成员用 `::ll::TypedStorage<对齐, 大小, 类型>` 声明（如 `ResolvedItemIconInfo` 已有 `mIconName`、`mIconFrame`、`mIconType` 等完整成员），类型未知的用 `::ll::UntypedStorage<对齐, 大小>`，可用 `.as<T>()` 按实际类型访问；但仍有部分 `enum` 没有枚举值、部分类为空类（`{}`）。

遇到这些情况需要自己补全定义，可对照其他实现（如 Nukkit 系项目、协议文档）或自行逆向。

*适用版本：当前所有 LeviLamina 版本*

## LeviLamina 的 API 对裸指针有什么约定？`Player*` 之类还能用吗？可空的参数/返回值应该用什么？

LeviLamina 自身 API 的输入/返回不使用裸指针：原先的 `Player*` 等改为 `Player&` 等引用；可能为空的非拥有引用使用 `optional_ref<T>`（头文件 `mc/deps/core/utility/optional_ref.h`，已由 `mc/_HeaderOutputPredefine.h` 引入，例如 `ll::service::getLevel()` 返回 `optional_ref<Level>`、`PlayerInfo::fromXuid` 返回 `optional_ref<PlayerInfoEntry const>`）；由 LL 管理所有权的对象使用 `std::shared_ptr` / `std::unique_ptr` 等智能指针。

注意 mc 下逆向生成的原版函数签名仍可能带裸指针。

*适用版本：LeviLamina 0.6 及以上至当前版本*

## C++ mod 中如何自己构造一个 `ActorUniqueID`？

`ActorUniqueID` 是只有一个成员 `int64 rawID` 的聚合结构体，直接聚合初始化即可：`auto id = ActorUniqueID{123};`。`ActorUniqueID{}` 会把 `rawID` 置 0；注意 `ActorUniqueID id;` 不初始化 `rawID`。需要无效 ID 时可用 `ActorUniqueID::INVALID_ID()`。

## C++ mod 开发中，如何从 `ItemActor` 得到 `Actor`？能否用 `dynamic_cast`？

`ItemActor` 公有继承自 `Actor`，`ItemActor*` 本身就可以直接当作 `Actor*` 使用（隐式向上转换），不需要额外转换。BDS 没有 RTTI，`dynamic_cast` 不能用。同理 `ItemStack` 继承自 `ItemStackBase`，需要 `ItemStackBase` 的 API 直接传 `ItemStack` 即可。

## C++ 的 `switch` 不能直接对 `std::string` 做分支，开发 LeviLamina mod 时怎样避免写一堆 `if-else`？

先把字符串哈希成整数再 `switch`。LeviLamina 自带 `#include "ll/api/utils/HashUtils.h"`，其中的 `ll::hash_utils::doHash(std::string_view)` 是 `constexpr`；字面量运算符 `"xxx"_h` 是 `consteval`（位于命名空间 `ll::literals::hash_literals`），可以直接写在 `case` 标签里：

```cpp
using namespace ll::literals;
switch (ll::hash_utils::doHash(str)) {
case "foo"_h: ...; break;
case "bar"_h: ...; break;
}
```

标准库的 `std::hash<std::string>{}(str)` 不是 `constexpr`，不能用在 `case` 标签里。

*适用版本：LeviLamina 0.8 及以上*

## LL2（LiteLoaderBDS）中的 LLAPI（如 `Block` 相关接口、各类事件、NBT）在 LeviLamina 中还有吗？怎么找对应接口？

LL2 的 API 在 LeviLamina 中并没有一一保留，而是重写/直接使用 BDS 原生类（LSE 就是基于 LeviLamina 移植的），命名方式与 LL2 不同，可查 API 文档 <https://levimc.org/LeviLamina/api/>（例如 `Block` 类）；方块可通过 BDS 自身的方块注册表获取。LeviLamina 只提供基础事件（见 `src/ll/api/event`），需要 LL2 那样的全部事件可参考 LegacyScriptEngine 中整理好的 hook 实现（`src/lse/events/*Hooks.cpp`）。不建议照抄 LL2 代码，参考 LSE 的实现更好。

## LeviLamina 头文件中有些函数的参数没有名字（IDE 提示为空或只有一半参数名），是什么原因？

这些通常是新版本 BDS 新增、尚未分析出参数含义的函数，头文件为自动生成，所以没有参数名。可以自己验证参数作用后向 LeviLamina 反馈（提 issue），被采纳后会加入自动生成数据，后续版本的头文件就会带上参数名。

*适用版本：所有版本。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 头文件中标记为 `LLNDAPI` 的函数是什么意思？返回的 `ll::Expected<>` 有什么用？

`LLNDAPI` 即 `[[nodiscard]] LLAPI`，表示返回值不应被丢弃。像 `ll::i18n::load` 这类返回 `ll::Expected<>`（`Expected<void>`）的函数，应检查返回值，出错时可通过 `.error().log(logger)` 输出错误信息，例如：

```cpp
if (auto res = ll::i18n::load(path); !res) res.error().log(getSelf().getLogger());
```

## LeviLamina 头文件中缺少需要的函数/符号/虚表，或者 `mUnk` 成员的类型不知道，该怎么办？

`mUnk` 成员的类型只能靠猜或用 IDA 等工具逆向分析。标记为 `MCNAPI` 的函数是尚未导出、不可调用的；缺少函数、符号或需要成员类型时，到 <https://github.com/LiteLDev/mcapi-requests/issues/new> 提交请求（附上缺失的符号）。提交前可先在在线文档/最新头文件中确认是否已恢复为 `MCAPI`。

## LeviLamina 有没有封装好的获取系统时间的函数？

有。头文件 `ll/api/utils/SystemUtils.h` 中的 `ll::sys_utils::getLocalTime()`（命名空间 `ll::inline utils::sys_utils`，所以可直接写 `ll::sys_utils::`）返回 `ll::data::TmWithMs`（`std::tm` + 毫秒），不需要自己封装。当前版本仍存在该函数。

*适用版本：LeviLamina 0.13 及以上*

## LeviLamina 的 i18n 翻译字符串格式化语法是什么？

使用 `fmt::format` 语法（`{}` 占位符、`{0}` 位置参数、具名参数、格式说明符等），例如 `"key"_tr(arg1, arg2)`，翻译文本中用 `{}` / `{0}` 引用参数。

*适用版本：所有版本*

## 在 LeviLamina 原生 mod 中如何计算两个颜色的相似度（例如为地图画/像素画匹配方块颜色）？

LeviLamina 头文件中的 `mce::Color`（现位于 `src/mc/deps/core/math/Color.h`）提供了 `deltaE76` / `deltaE94` / `deltaE00` 以及 `distanceTo`（等价于 `deltaE00`）等函数，会先把 sRGB 转到线性、XYZ、Lab 色彩空间再计算色差，可直接调用，也可照着实现移植到其他语言。

做地图画时要取方块的地图色而不是方块本身颜色：`BlockType` 有 `getMapColor(BlockSource&, BlockPos const&, Block const&)` 虚函数和 `mMapColor` 成员，可遍历所有已注册方块获取。取到的 8 位十六进制颜色最后两位是透明度（`ff`），转 RGB 时去掉。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 头文件中，斧头物品对应的类是哪个？

斧头是 `HatchetItem`（`mc/world/item/HatchetItem.h`）；它继承自 `DiggerItem`，搜索 `DiggerItem` 可以找到所有挖掘工具类物品。

*适用版本：LeviLamina 当前版本*

## LeviLamina 新版头文件中 `mc/deps/json/JsonHelpers.h` 找不到了，`JsonHelpers` 现在应该 include 哪个路径？

改为 `#include "mc/util/JsonHelpers.h"`。头文件位置变化时可直接在 LeviLamina 头文件中搜索类名。

*适用版本：LeviLamina 1.0.0 及以上*

## 开发 LeviLamina C++ mod 时如何方便地读取 Windows 注册表？

可以用 xmake 引入第三方库 WinReg（<https://github.com/GiovanniDicanio/WinReg>）：在 `xmake.lua` 中 `add_requires("winreg")`，在 target 里 `add_packages("winreg")`，代码中 `#include <WinReg/WinReg.hpp>` 使用 `winreg::RegKey`，比直接调用 Win32 API 简洁。

*适用版本：当前所有版本（Windows 平台）*
