# 存储数据

插件要保存两类数据：服主编辑的设置，以及插件自己写入的数据，例如玩家的家或积分。本指南把设置放进配置文件，把数据保存在键值数据库中，
最后介绍 SQL 的用法去哪里查。

示例使用 JavaScript；API 在每种语言中都相同（在 Lua 中直接调用类，不写 `new`）。路径相对于服务器文件夹。把插件的文件放在它自己的文件夹
`plugins/<插件名>/` 中，也就是插件在 `mods/` 中的文件夹（见[插件与引擎](../concepts/plugins.md)）。

## 配置文件中的设置

### 1. 带默认内容打开文件

`new JsonConfigFile(path, default)` 打开一个 JSON 文件；文件不存在时，用默认内容创建它：

```js
const conf = new JsonConfigFile("plugins/MyPlugin/config.json", JSON.stringify({
    welcome: "Welcome to the server!",
    reward: 1,
}));
```

路径中的文件夹会在需要时创建。如果文件无法打开，构造函数会抛出错误。

### 2. 读取设置

`conf.get(name, default)` 返回某项设置的值，缺少该项时返回默认值：

```js
const welcome = conf.get("welcome", "Welcome!");
const reward = conf.get("reward", 1);

mc.listen("onJoin", (player) => {
    player.tell(welcome);
});
```

`conf.init(name, default)` 一次完成两件事：返回设置的值，缺少该项时把默认值写进文件。用它给已有的文件添加设置很方便：

```js
const maxHomes = conf.init("maxHomes", 3);
```

### 3. 写入与重新加载

`conf.set(name, value)` 修改一项设置并立即写入文件；`conf.delete(name)` 删除一项。值可以是数字、字符串、布尔值、数组和对象。

配置对象从内存中读取。服主在服务器运行时编辑了文件，就调用 `conf.reload()` 重新读取，例如通过一个控制台命令：

```js
mc.regConsoleCmd("reloadconf", "Reloads the configuration of MyPlugin", (args) => {
    conf.reload();
    log("Configuration reloaded.");
});
```

`new IniConfigFile(path, default)` 以同样的方式处理带分节的 INI 文件：`conf.init(section, name, default)`、`conf.getStr`、
`conf.getInt`、`conf.getFloat`、`conf.getBool`。见[配置文件 API](../apis/DataAPI/ConfigFile.md)。

## 键值数据库中的数据

对于插件自己写入的数据，使用键值数据库：它把值保存在名称之下，存放在一个文件夹中，不需要供人编辑的文件。

### 1. 打开数据库

```js
const db = new KVDatabase("plugins/MyPlugin/data");
```

路径是一个文件夹，需要时会被创建。如果那里已经有数据库，就打开它。如果数据库无法打开，构造函数返回 `Null`。

### 2. 写入和读取值

`db.set(name, value)` 保存一个值，`db.get(name)` 返回它（不存在时为 `Null`），`db.delete(name)` 删除它，`db.listKey()`
返回所有名称。值可以是数字、字符串、布尔值、数组和对象。下面的插件以 XUID 为键统计每个玩家的来访次数：

```js
mc.listen("onJoin", (player) => {
    const key = `visits.${player.xuid}`;
    const visits = (db.get(key) ?? 0) + 1;
    db.set(key, visits);
    player.tell(`This is your visit number ${visits}.`);
});
```

以玩家的 XUID（`player.xuid`）而不是名字作为键来保存玩家的数据。

### 3. 插件卸载时关闭它

```js
ll.onUnload(() => {
    db.close();
});
```

`close` 之后不要再使用这个数据库。见[数据库 API](../apis/DataAPI/DataBase.md)。

## SQL 数据库

对于表格形式的数据，用 `new DBSession(type, params)` 打开一个 SQL 会话：`"sqlite3"` 用于数据库文件，`"mysql"` 用于 MySQL
服务器。对来自玩家的值使用预处理语句：

```js
const session = new DBSession("sqlite3", { path: "plugins/MyPlugin/data.db" });
session.exec("CREATE TABLE IF NOT EXISTS visits (xuid TEXT, time TEXT)");

mc.listen("onJoin", (player) => {
    const stmt = session.prepare("INSERT INTO visits VALUES (?, ?)");
    stmt.bind([player.xuid, system.getTimeStr()]);
    stmt.execute();
});
```

SQL API 的函数失败时会抛出错误：在 JavaScript 中用 `try … catch`，在 Lua 中用 `pcall`。[数据库 API](../apis/DataAPI/DataBase.md)
介绍了连接参数、`session.query` 和预处理语句。

## 存放数据的其他地方

- [玩家绑定数据](../apis/DataAPI/PlayerData.md)：按名字或 XUID 查找不在线的玩家。
- [经济系统](../apis/DataAPI/Economy.md)：玩家的金钱。
- [文件 API](../apis/SystemAPI/File.md)：自己读写任意文件。
