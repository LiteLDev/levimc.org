# LeviLamina 模组 API：数据、配置与多语言

## LeviLamina 中 `CompoundTag` 旧的 `getInt`/`getString` 等取值函数不能用（曾被标记为 deprecated），现在应该怎么读取 NBT 值？

用下标或 `at()` 访问，得到 `CompoundTagVariant` 后再取值：`tag["key"]` 或 `tag.at("key")`（维护者更推荐 `operator[]`，可链式访问嵌套，如 `nbt["a"]["b"]["c"]`）。取值方式：数值类型用 `tag["key"].get<int>()` 或直接转换 `int{tag["key"]}`；字符串可直接转换为 `std::string const&`（或 `get_ref<std::string&>()`）；要拿具体 Tag 类型用 `tag["key"].get<IntTag>()` / `get<CompoundTag>()` / `get<ListTag>()`；判断存在用 `tag.contains("key")` 或 `contains("key", Tag::Type)`。写入可直接赋值：`nbt["key"] = 1;`、`nbt["list"] = ListTag{1.0, 2.0};`。更多用法参考 LeviLamina 仓库测试代码 `src-test/server/TestNbt.cpp`。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## 使用 LeviLamina 的配置 API（`ll::config::loadConfig` / `saveConfig`）时，配置结构体有什么要求？

配置结构体必须可反射（普通聚合结构体即可），并且必须包含一个整数类型的 `version` 字段（如 `int version = 1;`），否则不满足 `IsConfig` 约束无法编译。`loadConfig` 会比较文件中的 `version` 与结构体默认值：不一致或缺失时调用 updater（默认 `defaultConfigUpdater`：以当前结构体为底合并文件中的旧值）并返回 `false`，调用方可据此重新 `saveConfig` 写回升级后的配置。如果不想要 `version` 字段，只能自己基于 `ll::reflection::serialize`/`deserialize` 另写一套读写。

*适用版本：LeviLamina 0.11 及以上至当前 v26.60.8*

## LeviLamina 中旧 LL2 的 PlayerInfoAPI / namedb（玩家名与 xuid/uuid 对应数据库）在哪？能查询离线玩家、遍历全部玩家吗？

对应功能叫 `ll::service::PlayerInfo`，头文件 `ll/api/service/PlayerInfo.h`，基于 leveldb 存储已知玩家的 UUID、XUID 与名称。用 `PlayerInfo::getInstance()` 获取实例，`fromUuid` / `fromXuid` / `fromName` 查询单个玩家（返回 `optional_ref<PlayerInfoEntry const>`，离线玩家也可查到），`entries()` 返回生成器可遍历全部记录，`erase(uuid)` 删除记录。

脚本侧 LSE 可用 `data.getAllPlayerInfo()` 获取全部玩家信息。

*适用版本：LeviLamina 0.9 及以上至当前版本*

## LeviLamina C++ mod 要保存玩家数据，有没有内置数据库？LiteLoaderBDS 时代自带的 MySQL 库（`session.h`）还在吗？要用 MySQL 怎么办？

LeviLamina 不再内置旧 LiteLoaderBDS 的 MySQL/数据库封装（`session.h`）。简单的本地存储可用自带的 `ll::data::KeyValueDB`（`ll/api/data/KeyValueDB.h`，基于 LevelDB）；需要关系型数据库时可在 mod 里通过 xmake（`add_requires`）自行引入第三方库，如 SQLite 或 MySQL 客户端库，并随 mod 一起分发其动态库。只有当网站、QQ 机器人等外部程序也要访问数据时，才有必要上 MySQL 这类服务端数据库。

脚本侧 LSE 则自带数据库 API（`DBSession`，支持 SQLite 和 MySQL）。

*适用版本：LeviLamina 0.x 至当前版本*

## LeviLamina C++ 插件开发中，有没有类似 LLSE 那样读写 JSON 的 API？

LeviLamina 提供配置文件 API（`ll/api/Config.h` 中的 `ll::config::loadConfig` / `saveConfig`，基于反射自动序列化，配置结构体需带整数 `version` 字段）。如果只是普通的 JSON 读写或存数据，可以直接用 LeviLamina 依赖里自带的 `nlohmann::json` 库（`Config.h` 本身就包含 `nlohmann/json.hpp`）。

## LeviLamina 中如何获取物品的 NBT，以及如何从 NBT 构造物品？

导出：`ItemStack::save` 现在需要一个 `SaveContext`，例如：

```cpp
auto tag = item.save(*SaveContextFactory::createCloneSaveContext());
```

它返回 `std::unique_ptr<CompoundTag>`，头文件为 `mc/world/item/SaveContextFactory.h`。

从 NBT 构造：使用静态函数 `ItemStack::fromTag(CompoundTag const&)`（或带 `ILevel&` 的重载）。

BDS 原版已有完整的 NBT 读写接口，不再需要 LL2 那种层层封装的 NBT API。以上适用于 `save` 需要 `SaveContext` 的 BDS 版本起。

## LeviLamina 源码中的 `src/ll/api/reflection/Dispatcher.h` 是做什么用的？

`ll::reflection::Dispatcher<Storage, Listener, CallInit>` 是观察者模式的封装，主要给配置文件用：把配置字段包装成 `Dispatcher` 后，每次对它赋值（包括反序列化读取配置时）都会调用 `listener.call(storage)`，从而在配置变化时自动执行逻辑；`CallInit=true` 时构造时也会调用一次。反射的序列化/反序列化对 `Dispatcher` 有专门支持。LeviLamina 自身配置就有用例：

```cpp
ll::reflection::Dispatcher<bool, ForceEnableCheatCommands> forceEnableCheatCommands = true;
```

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 的 API 用的是哪个 JSON 库？

用的是 nlohmann json（LL 的配置 API `ll/api/Config.h` 默认使用 `nlohmann::ordered_json`）。BDS 内部同时还有 rapidjson、jsoncpp。

*适用版本：所有版本*

## LeviLamina 的 `ll::config` 读取带注释的 JSON（jsonc）配置文件后，重启服务器发现配置里的注释全部消失了，是不支持注释吗？

`ll::config` 基于 `nlohmann::ordered_json`：`loadConfig` 解析时会忽略注释（能读取带注释的文件），但不会保留注释；常见写法是 `loadConfig` 返回 `false`（版本不同/需更新）时再 `saveConfig` 回写，或每次加载后都保存，此时由 nlohmann `dump` 生成的文件就不含注释了。如需保留注释，需要自己换用能保留注释的 JSON/jsonc 库或其他配置格式（如 TOML），或避免自动回写。

*适用版本：所有版本*

## LeviLamina 的反射/配置序列化中，可组合的 flag 枚举（如 `A|B`）被序列化成空字符串，怎么处理？

当前 LeviLamina 的反射已内置 flags 枚举支持：序列化时，若 `magic_enum` 将其识别为 flags 枚举，会用 `magic_enum::enum_flags_name` 输出 `"A|B"`，名称为空则回退输出底层整数；反序列化时同时尝试 `enum_cast` 与 `enum_flags_cast`，支持 `"A|B|C"` 字符串。

关键是让 `magic_enum` 把该枚举识别为 flags：按 `magic_enum` 文档特化 `magic_enum::customize::enum_range<YourEnum>`，并设置 `static constexpr bool is_flags = true`。

旧版本需要自己写 `format_as`，用 `enum_flags_name` 并回退到 `enum_integer`。

*适用版本：LeviLamina 26.60.x；旧版需自行实现 `format_as`*

## mod 中按数字物品 ID 判断物品（如收纳袋）可靠吗？

不可靠，加载 Addons 后物品的数字 ID 可能变化。应使用物品类型名判断，例如 `item.getTypeName() == "minecraft:bundle"`，虽然字符串比较比 `short` 比较稍慢。

## 使用 `ll::config::loadConfig` 加载含 `std::vector<int>` 或 `std::map` 的配置结构体，修改 json 后读到的值仍为空，是反射不支持吗？

`std::vector` 等容器的反射是支持的（`Deserialization.h` 中走 ArrayLike 分支），`std::map` 等关联容器也支持（Associative 分支），key 可以是字符串、enum（序列化为字符串）或特化了 `ll::reflection::Serializer<T>::to_string` / `from_string` 的类型。

读到空值的真正原因是把 config 定义为头文件里的 `static` 全局变量：头文件中的 `static` 变量在每个包含它的编译单元里各有一份副本，`loadConfig` 写入的和别的文件读取的不是同一个对象。应在头文件用 `extern` 声明、在一个 `.cpp` 中定义（或用 `inline` 变量）。

修改 config 结构后记得递增 `version`。存储自定义键值时，用 `std::map<std::string, std::string>` 之类的容器，而不是把 json 当 map 用。

*适用版本：LeviLamina 0.10 及以上*

## 原生 mod 中如何通过存档数据读取离线玩家的背包、末影箱、位置等信息，以及玩家名？

1. 通过 `ll::service::getDBStorage()` 读取键 `"player_<uuid>"`（`DBHelpers::Category::All`），得到一个 `CompoundTag`，取其中的 `"ServerId"` 字符串。
2. 以该 serverId 为 key、`DBHelpers::Category::Player` 从存档数据库读出玩家 NBT（`getCompoundTag`），手动解析其中的背包、末影箱、位置等字段。

玩家名不在该 NBT 中，可用 `ll::service::PlayerInfo::getInstance().fromUuid(uuid)` 得到 name/xuid。可参考 LSE 中 `getPlayerNbt` / `setPlayerNbt` 的实现。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina C++ mod 中如何获取 `DBStorage` 对象，而不必自己 hook 函数去拿？

通过 Level 拿到 `LevelStorage`：`ll::service::getLevel()->getLevelStorage()`。服务端上它的实际类型就是 `DBStorage`（`class DBStorage : public LevelStorage`），可以 `static_cast<DBStorage&>(level.getLevelStorage())` 后使用。不推荐依赖第三方库（如 GMLIB）hook 缓存的 `DBStorage*`。

*适用版本：LeviLamina 1.x 及以上*

## 在 LeviLamina C++ mod 中，用 `std::format` 拼接 SNBT 字符串（如 `{Findable:0b,Items:[],id:Chest,isMovable:1b,x:8,y:66,z:-41}`）后调用 `CompoundTag::fromSnbt`，结果返回空，为什么？

`std::format` / `fmt::format` 中的大括号是占位符，字面的 `{` `}` 必须转义成 `{{` `}}`，否则拼出来的 SNBT 不合法，`fromSnbt` 解析失败返回空（`fromSnbt` 返回 optional/Expected，应检查结果）。

建议直接用原始字符串字面量 `R"(...)"` 书写 SNBT，或直接用 `CompoundTag` 的 API 按键值构造 NBT，不要用 format 拼 SNBT。NBT 用法可参考 LeviLamina 仓库 `src-test/server/TestNbt.cpp`。`toSnbt` 支持多种 `SnbtFormat` 输出选项（如 `PrettyFilePrint`、`Jsonify` 等）。

*适用版本：当前所有 LeviLamina 版本*

## 在 LeviLamina C++ mod 里，`ItemStack` 指针怎么转成 `ItemStackBase`？需要 `dynamic_cast` 吗？

`ItemStack` 公有继承自 `ItemStackBase`，子类转父类不需要 `dynamic_cast`（BDS 也没有 RTTI）：解引用后直接当 `ItemStackBase&` 用即可（隐式向上转换），或显式写 `static_cast<ItemStackBase&>(*item)`。要复制物品可以用 `ItemStack::clone() const`。

*适用版本：当前所有 LeviLamina 版本*

## 在 LeviLamina C++ 中如何优雅地将 NBT（`CompoundTag`）与 JSON 互相转换？

两者无法完好无损地互转：JSON 没有 byte/short/int/float 等类型区分，NBT 字符串可以是任意二进制而 JSON 有限制。

若不在意这些，可用 `toSnbt(SnbtFormat::Jsonify)` 输出 JSON 兼容格式（键加引号、类型信息以注释形式保留），再用 JSON 库解析；JSON 无法表示的二进制字符串会被转成 base64（带 `/*BASE64*/` 标记）。反向可用 `CompoundTag::fromSnbt` 解析。

更推荐直接存 NBT，需要可视化时用 SNBT。

*适用版本：当前所有 LeviLamina 版本*

## 想往 BDS 存档的 LevelDB 中写入自定义数据（如地图数字水印）并且不被 BDS 清理，直接用 Node.js 通用 leveldb 库写入后数据消失，应该怎么做？

BDS 的 LevelDB 是 Mojang 修改过的版本（带自有压缩格式），通用 leveldb 库默认不支持，外部写入不可靠；BDS 本身不会主动删除未知 key 的数据。在 mod 中可以用 `LevelStorage` 接口（`mc/world/level/storage/LevelStorage.h`）写入自定义 key，例如 `saveData(std::string const& key, std::string&& data, DBHelpers::Category category)` 或 `saveData(key, CompoundTag const&, category)`，读取用 `loadData`/`getCompoundTag`；`DBHelpers::Category` 参数基本不影响实际存储，真正起作用的是 key。若只是做水印，更稳妥的原版方式是给隐蔽位置的容器方块或生物命名，名称会保存在 NBT 中。

*适用版本：当前 LeviLamina 版本*
