# LeviLamina mod API: other apis

## How do I implement multi-language support (i18n) in a native LeviLamina C++ mod: where do language files go, how are they loaded, and how do I use `_tr`?

Do it the same way LeviLamina itself does: hard-code English in the code (used as the key), then provide a json translation file per language, shipped with the mod in `lang/` under the mod directory (such as `lang/zh_CN.json`, with contents like `{"hello {}": "你好 {}"}`). Load them in the mod's `load()` with `ll::i18n::getInstance().load(getSelf().getLangDir())` (when the path is a directory, all `.json` files in it are read and the file name is the language code; you can also pass a single json file, in which case the top-level keys are language codes). Usage:

```cpp
#include "ll/api/i18n/I18n.h"
using namespace ll::i18n_literals;
int a = 114514;
"hello {}"_tr(a);
```

When the default language (the LeviLamina config `language`, default `"system"`, which follows the system) is `zh_CN` and the `zh_CN` translation is loaded, this outputs "你好 114514"; when no translation is found, it outputs "hello 114514" unchanged. You can also specify the language explicitly with `"hello {}"_trl("zh_CN", a)`. `I18n.h` also provides the `LL_I18N_COLLECT_STRINGS` macro to collect all `_tr` strings in the code, which helps generate translation templates. When packaging, make sure the `lang` directory is copied into the output: the current template uses levibuildscript's `modpacker` rule (the old template's `after_build.lua` has been removed), and `modpacker` only copies the dll, pdb and `manifest.json` to `bin/<modName>/`, not the `lang` directory. Add an `after_build` in `xmake.lua` that copies it with `os.cp`, or put it into the mod directory manually when releasing.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## Some `enum`s in the LeviLamina headers are empty, and some structs (for example `ResolvedItemIconInfo`, returned by `getIconInfo`) have only a constructor and no members. Is that normal? Do I need to fill them in myself?

Yes, it is normal. The mc headers are generated automatically from reverse engineering. Most classes/structs now have their member layout generated: members of known types are declared with `::ll::TypedStorage<alignment, size, type>` (for example `ResolvedItemIconInfo` now has complete members such as `mIconName`, `mIconFrame` and `mIconType`), and members of unknown types use `::ll::UntypedStorage<alignment, size>`, which you can access as the actual type with `.as<T>()`. However, some `enum`s still have no enumerators and some classes are still empty (`{}`).

In those cases you need to complete the definitions yourself, by referring to other implementations (such as Nukkit-based projects or protocol documentation) or by reverse engineering them.

*Applies to: all current LeviLamina versions*

## What are LeviLamina's API conventions for raw pointers? Can I still use `Player*` and the like? What should I use for nullable parameters and return values?

LeviLamina's own APIs do not use raw pointers for inputs or return values: the former `Player*` and similar became references such as `Player&`. A non-owning reference that may be empty uses `optional_ref<T>` (header `mc/deps/core/utility/optional_ref.h`, already included by `mc/_HeaderOutputPredefine.h`; for example `ll::service::getLevel()` returns `optional_ref<Level>` and `PlayerInfo::fromXuid` returns `optional_ref<PlayerInfoEntry const>`). Objects whose ownership is managed by LL use smart pointers such as `std::shared_ptr` / `std::unique_ptr`.

Note that vanilla function signatures reverse-generated under mc may still contain raw pointers.

*Applies to: LeviLamina 0.6 and later, up to the current version*

## How do I construct an `ActorUniqueID` myself in a C++ mod?

`ActorUniqueID` is an aggregate struct with a single member `int64 rawID`, so aggregate initialization works: `auto id = ActorUniqueID{123};`. `ActorUniqueID{}` sets `rawID` to 0; note that `ActorUniqueID id;` does not initialize `rawID`. When you need an invalid ID, use `ActorUniqueID::INVALID_ID()`.

## In C++ mod development, how do I get an `Actor` from an `ItemActor`? Can I use `dynamic_cast`?

`ItemActor` inherits publicly from `Actor`, so an `ItemActor*` can be used directly as an `Actor*` (implicit upcast) with no extra conversion. BDS has no RTTI, so `dynamic_cast` cannot be used. Likewise, `ItemStack` inherits from `ItemStackBase`; where an `ItemStackBase` API is needed, just pass the `ItemStack`.

## C++ `switch` cannot branch directly on `std::string`. How do I avoid a pile of `if-else` when developing a LeviLamina mod?

Hash the string into an integer first and then `switch`. LeviLamina ships `#include "ll/api/utils/HashUtils.h"`, in which `ll::hash_utils::doHash(std::string_view)` is `constexpr`; the literal operator `"xxx"_h` is `consteval` (in the namespace `ll::literals::hash_literals`) and can be written directly in `case` labels:

```cpp
using namespace ll::literals;
switch (ll::hash_utils::doHash(str)) {
case "foo"_h: ...; break;
case "bar"_h: ...; break;
}
```

The standard library's `std::hash<std::string>{}(str)` is not `constexpr` and cannot be used in `case` labels.

*Applies to: LeviLamina 0.8 and later*

## Does LL2 (LiteLoaderBDS)'s LLAPI (such as the `Block` interfaces, the various events, NBT) still exist in LeviLamina? How do I find the corresponding interfaces?

LL2's API was not kept one-to-one in LeviLamina; it was rewritten or replaced by direct use of BDS native classes (LSE was ported on top of LeviLamina), and the naming differs from LL2. See the API documentation at <https://levimc.org/LeviLamina/api/> (for example the `Block` class); blocks can be obtained from BDS's own block registry. LeviLamina provides only basic events (see `src/ll/api/event`); if you need all the events LL2 had, refer to the hook implementations collected in LegacyScriptEngine (`src/lse/events/*Hooks.cpp`). Copying LL2 code is not recommended; following the LSE implementation is better.

## Why do some functions in the LeviLamina headers have unnamed parameters (the IDE shows nothing, or only some of the parameter names)?

These are usually functions added in a new BDS version whose parameters have not been analyzed yet; the headers are auto-generated, so they have no parameter names. If you verify what the parameters do, you can report it to LeviLamina (open an issue); once accepted it is added to the generated data, and headers of later versions will include the parameter names.

*Applies to: all versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What does a function marked `LLNDAPI` in the LeviLamina headers mean? What is the returned `ll::Expected<>` for?

`LLNDAPI` is `[[nodiscard]] LLAPI`, meaning the return value must not be discarded. For functions such as `ll::i18n::load` that return `ll::Expected<>` (`Expected<void>`), check the return value; on error you can print the error message with `.error().log(logger)`, for example:

```cpp
if (auto res = ll::i18n::load(path); !res) res.error().log(getSelf().getLogger());
```

## What should I do when a function, symbol or vtable I need is missing from the LeviLamina headers, or when I do not know the type of a `mUnk` member?

The type of a `mUnk` member can only be guessed or reverse-engineered with tools such as IDA. Functions marked `MCNAPI` are not yet exported and cannot be called. When a function or symbol is missing, or you need a member's type, submit a request (with the missing symbol) at <https://github.com/LiteLDev/mcapi-requests/issues/new>. Before submitting, check the online documentation or the latest headers to see whether it has already been restored as `MCAPI`.

## Does LeviLamina have a ready-made function for getting the system time?

Yes. `ll::sys_utils::getLocalTime()` in the header `ll/api/utils/SystemUtils.h` (namespace `ll::inline utils::sys_utils`, so you can write `ll::sys_utils::` directly) returns `ll::data::TmWithMs` (`std::tm` plus milliseconds); you do not need to write your own wrapper. The function still exists in the current version.

*Applies to: LeviLamina 0.13 and later*

## What is the format syntax of LeviLamina's i18n translation strings?

It uses `fmt::format` syntax (`{}` placeholders, `{0}` positional arguments, named arguments, format specifiers and so on), for example `"key"_tr(arg1, arg2)`; in the translation text, refer to arguments with `{}` / `{0}`.

*Applies to: all versions*

## How do I compute the similarity of two colors in a native LeviLamina mod (for example to match block colors for map art/pixel art)?

`mce::Color` in the LeviLamina headers (now at `src/mc/deps/core/math/Color.h`) provides `deltaE76` / `deltaE94` / `deltaE00` and `distanceTo` (equivalent to `deltaE00`). They convert sRGB to linear, XYZ and then Lab color space before computing the color difference. You can call them directly, or port the implementation to another language.

For map art, use the block's map color rather than the block's own color: `BlockType` has a `getMapColor(BlockSource&, BlockPos const&, Block const&)` virtual function and an `mMapColor` member, and you can iterate over all registered blocks to get them. In the 8-digit hexadecimal color you get, the last two digits are the alpha (`ff`); drop them when converting to RGB.

*Applies to: LeviLamina current version*

## Which class represents the axe item in the LeviLamina headers?

The axe is `HatchetItem` (`mc/world/item/HatchetItem.h`). It inherits from `DiggerItem`; search for `DiggerItem` to find all digging-tool items.

*Applies to: LeviLamina current version*

## In newer LeviLamina headers `mc/deps/json/JsonHelpers.h` is gone. Which path should I include for `JsonHelpers` now?

Use `#include "mc/util/JsonHelpers.h"`. When a header moves, search the LeviLamina headers for the class name.

*Applies to: LeviLamina 1.0.0 and later*

## How can I read the Windows registry conveniently in a LeviLamina C++ mod?

Pull in the third-party library WinReg (<https://github.com/GiovanniDicanio/WinReg>) with xmake: add `add_requires("winreg")` in `xmake.lua`, add `add_packages("winreg")` in the target, and in code use `#include <WinReg/WinReg.hpp>` and `winreg::RegKey`. This is simpler than calling the Win32 API directly.

*Applies to: All current versions (Windows only)*
