# LegacyRemoteCall

## When a C++ mod exports a function to LSE scripts with LegacyRemoteCall (`RemoteCall::exportAs`), using `std::variant` for a parameter or return value fails to compile with `static_assert` "Unsupported Type". What can I do?

RemoteCall parameters and return values support only a fixed set of types (`bool`, `std::string`, `nullptr_t`, integers/floating-point numbers (`NumberType`), `Player*`/`Actor*`/`BlockActor*`/`Container*`, positions (`WorldPosType`/`BlockPosType`), `ItemType`, `BlockType`, `NbtType`, and `std::vector` and `std::unordered_map<std::string, T>` built from these types). `std::variant` is not supported, so it triggers `static_assert(is_supported_type_v<...>, "Unsupported Type")`.

To fix it, change the parameter to a supported type. The simplest way is to serialize the data into a JSON string (`std::string`) and parse it on the receiving side. You can also write your own template to convert the variant (possible in theory, but cumbersome).

Also note that numbers passed to JS are converted as double (in LSE: `Number::newNumber(v.get<double>())`), so large integers such as `long long` may lose precision; pass them as strings if necessary.

*Applies to: LegacyRemoteCall, all current versions (up to 0.23.x)*

## How can a C++ mod on LeviLamina expose an interface to other plugins (especially LSE JS script plugins)?

Use LegacyRemoteCall (RemoteCall). In the C++ mod, export a function with `RemoteCall::exportAs("namespace", "function name", function)`; on the JS side, import it with `ll.imports("namespace", "function name")` and call it. (When JS exports a function itself, it is `ll.exports(func, "namespace", "function name")`; note that the function is the first argument.) (You can check whether it exists first with `ll.hasExported`.) For how to export, see GMLIB-LegacyRemoteCallApi (LRCA); for namespaces and function names, an easily recognizable form such as `Actor.getName` is recommended. Pure native mods can also call each other directly by exporting functions with `dllexport`. LeviLamina itself does not include RemoteCall; it is provided by the separate LegacyRemoteCall mod (which LSE depends on). You can also connect through network communication or similar means.

*Applies to: LeviLamina current version; LegacyRemoteCall current version; LSE current version*

## If an async function is exported with `ll.exports` in LSE, can another plugin that imports it with `ll.imports` await the async return value?

No. Remote calls (`ll.exports`/`ll.imports`) execute synchronously: the return value of the called function is packed immediately (converted to `RemoteCall::ValueType`) and returned to the caller. A Promise is not passed across plugins, so the caller cannot await an asynchronous result, and if the called function blocks, it blocks the server main thread as well. When you need an asynchronous result, use another approach, such as having the other side call a different function you export when it finishes, writing to a database or file, or notifying through an event.

*Applies to: LSE, all current versions*

## Calling a function exported by another plugin with `ll.imports("namespace", "function name")` in an LSE plugin fails (for example because the function is not exported). How do I check first whether the exported function exists?

Use `ll.hasExported(namespace, name)` to check whether the function has been exported, and only then call the function obtained from `ll.imports` (calling it when it is not exported raises `Fail to import! Function [ns::name] has not been exported`). Also, RemoteCall parameters must be convertible: you cannot pass a function (`kFunction`) or a `ByteBuffer` as a parameter, or `Unsupported Type` is thrown. When troubleshooting, add logger output at every step and check return values with `typeof`.

*Applies to: LSE, all current versions*

## Which parameter types does RemoteCall on LeviLamina (cross-plugin calls with `ll.exports`/`ll.imports`) support? Can I pass objects such as Player, block and item?

Yes. The current LegacyRemoteCall + LSE support null, strings, numbers, booleans, arrays, plain objects (converted recursively by key and value), and game objects such as Player, Entity, Item, Block, BlockEntity, Container, FloatPos, IntPos and NbtCompound. Functions and `ByteBuffer` are not supported. If the other plugin does not know these types, you can pass a uuid/xuid, a position as JSON, an SNBT string and so on instead.

*Applies to: LSE 0.x release and later*

## Can the parameters of functions exported/called through RemoteCall (LegacyRemoteCall) use the `std::pair` type?

Only specific `std::pair` types are supported: `std::pair<Vec3, int>` (converted to `WorldPosType`, which corresponds to FloatPos in JS; position + dimension ID) and `std::pair<BlockPos, int>` (converted to `BlockPosType`, which corresponds to IntPos). The position parameters in GMLIB-LegacyRemoteCallApi are passed this way. An arbitrary `std::pair` (such as `std::pair<std::string, int>`) is not supported and triggers an `Unsupported Type` compile error.

*Applies to: LegacyRemoteCall, all current versions*

## What is `LLSEGlobal` that I see in LSE?

When you use `ll.exports` / `ll.imports` / `ll.hasExported` without specifying a namespace (passing only the function name), the default namespace `LLSEGlobal` is used automatically.

*Applies to: LSE, all current versions*

## What is LegacyRemoteCall (RemoteCall) and what problem does it solve? Should a new mod depend on it?

LegacyRemoteCall exports functions for cross-plugin calls, mainly so that LSE's JS/Lua plugins can call functions exported by C++ mods (it underlies `ll.exports`/`ll.imports`). It is a companion component of LegacyScriptEngine (LSE depends on it) and exists for compatibility with the old LLSE ecosystem. The maintainers advise that new native mods should not hard-depend on RemoteCall; if you need to offer an interface to scripts, write a separate optional external module that does the exporting.

*Applies to: current version (LegacyRemoteCall 0.23.x)*

## Which module implements cross-plugin function import/export (`ll.export`/`ll.import`) from the old LLSE in LeviLamina? How do I declare plugin load order and dependencies?

In LL2 it was provided by LL itself and ScriptEngine. In LeviLamina it is provided jointly by LegacyRemoteCall (<https://github.com/LiteLDev/LegacyRemoteCall>) and LSE: the function table lives in LegacyRemoteCall (it stores `std::function<ValueType(std::vector<ValueType>)>`), while the script-side `ll.exports`/`ll.imports` are defined in LSE (`ll.export`/`ll.import` are compatibility aliases). LeviLamina uses a modular design, and plugin dependencies and load order are declared in `manifest.json`: `dependencies` (required dependencies), plus fields such as `optionalDependencies`, `loadBefore` and `conflicts`.

*Applies to: LeviLamina current version; LSE current version*

## I installed GMLIB-LegacyRemoteCallApi, but plugins that depend on GMLIB still report a missing prerequisite. What should I do?

GMLIB and GMLIB-LegacyRemoteCallApi are not the same thing (the latter is only the RemoteCall interface layer for LSE script plugins), so you need to install GMLIB itself separately: <https://github.com/GroupMountain/GMLIB-Release>, or run `lip install github.com/GroupMountain/GMLIB-Release` in the server root directory.

*Applies to: LeviLamina servers that use GMLIB*

## After an upgrade, LSE's support libraries such as nodejs fail to install or load, with errors related to LegacyRemoteCall. What should I do?

This is caused by a version mismatch between LegacyRemoteCall and LegacyScriptEngine / LeviLamina; all three must match. The current LSE `lip.toml` already declares LegacyRemoteCall as a dependency (for example, LSE 0.23.x depends on LegacyRemoteCall 0.23.* and LeviLamina 26.60.*), so installing or updating with lip pulls in the matching version automatically: update the package with `lip update` (or `lip update github.com/LiteLDev/LegacyScriptEngine`); to change the LeviLamina version itself, use `lip setup`. When installing manually, be sure to replace LegacyRemoteCall as well. Commands follow the current lip.

## When exporting a function/event with RemoteCall for LSE to call, the call works but throws `bad variant access`. What is the cause?

`bad variant access` means the actual type of a parameter or return value does not match the type declared in `RemoteCall::exportAs` / `importAs` (internally the value is taken from a `std::variant` with `std::get`, which throws `std::bad_variant_access` when the type differs). Check that the types passed from JS match the signature of the C++ exported function. Do not declare parameters of basic numeric types (and of the converted types `WorldPosType` and `BlockPosType`) as references (neither `int&` nor `const int&` works); pass them by value instead. The newer `RemoteCallAPI.h` adds a `static_assert` against extracting references from conversions such as `NumberType`, so this form fails to compile (since 0.21.1, reference parameters cause a compile-time error).

*Applies to: LegacyRemoteCall current version*

## GMLIB loads fine, but GMLIB-LegacyRemoteCallApi (LRCA) fails to load. What is the cause?

Usually the versions do not match: GMLIB, GMLIB-LegacyRemoteCallApi, LegacyRemoteCall, iListenAttentively, LegacyScriptEngine and LeviLamina itself are not on compatible versions. Update LeviLamina and all related dependencies together to mutually matching versions, without leaving any out. The current LRCA manifest declares dependencies on GMLIB, LegacyRemoteCall, iListenAttentively and ModAPI, and a missing or mismatched one causes the load to fail. In addition, LRCA is a passive mod: it is loaded only when another mod or script plugin declares a dependency on it.

## Loading a plugin reports `[GMLIB-LegacyRemoteCallApi] setUnknownBlockCleaner is not implemented`. What happened to GMLIB's unknown-block cleaning API?

GMLIB's `setUnknownBlockCleaner` feature (cleaning unknown/wrong blocks) has been removed. LRCA keeps only an empty stub export, which prints `setUnknownBlockCleaner is not implemented` when called, so plugins that depend on it cannot use that feature. To clean unknown blocks, use GMEssentials (GME) instead: <https://github.com/GroupMountain/GMEssentials-Release/>

*Applies to: current GMLIB-LegacyRemoteCallApi version*

## An LSE plugin calling interfaces that GMLIB exports through GMLIB-LegacyRemoteCallApi (for example `translateString`) fails even though LegacyRemoteCallApi is installed. Why?

GMLIB-LegacyRemoteCallApi is a passive mod: it is loaded only when another mod or plugin depends on it. Declare it in the `dependencies` of your plugin's `manifest.json`, for example:

```json
"dependencies": [{ "name": "GMLIB-LegacyRemoteCallApi" }]
```

The `version` field of a dependency can be omitted (any version matches when omitted); if you write it, it is a version range constraint.
