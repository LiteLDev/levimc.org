# Storing data

A plugin keeps two kinds of data: settings that the server owner edits, and data that the plugin itself writes, such
as players' homes or points. This guide puts settings in a configuration file and keeps data in a key-value database,
then shows where to go for SQL.

The examples are in JavaScript; the API is the same in every language (in Lua, call the classes without `new`). Paths
are relative to the server folder. Keep your plugin's files in its own folder, `plugins/<plugin name>/`, which is the
plugin's folder in `mods/` (see [Plugins and engines](../concepts/plugins.md)).

## Settings in a configuration file

### 1. Open the file with defaults

`new JsonConfigFile(path, default)` opens a JSON file, and creates it with the default content if it does not exist:

```js
const conf = new JsonConfigFile("plugins/MyPlugin/config.json", JSON.stringify({
    welcome: "Welcome to the server!",
    reward: 1,
}));
```

The folders of the path are created if needed. If the file cannot be opened, the constructor throws an error.

### 2. Read the settings

`conf.get(name, default)` returns the value of a setting, or the default when it is missing:

```js
const welcome = conf.get("welcome", "Welcome!");
const reward = conf.get("reward", 1);

mc.listen("onJoin", (player) => {
    player.tell(welcome);
});
```

`conf.init(name, default)` does both at once: it returns the value of the setting, and writes the default into the
file when the setting is missing. It is a good way to add a setting to a file that already exists:

```js
const maxHomes = conf.init("maxHomes", 3);
```

### 3. Write and reload

`conf.set(name, value)` changes a setting and writes the file at once; `conf.delete(name)` removes one. The values can
be numbers, strings, booleans, arrays and objects.

The object reads from memory. When the server owner edits the file while the server runs, call `conf.reload()` to
read it again, for example from a console command:

```js
mc.regConsoleCmd("reloadconf", "Reloads the configuration of MyPlugin", (args) => {
    conf.reload();
    log("Configuration reloaded.");
});
```

`new IniConfigFile(path, default)` works the same way for an INI file, with sections:
`conf.init(section, name, default)`, `conf.getStr`, `conf.getInt`, `conf.getFloat`, `conf.getBool`. See the
[Configuration file API](../apis/DataAPI/ConfigFile.md).

## Data in a key-value database

For data that the plugin writes, use a key-value database: it stores values under names, in a folder, without a file
that people edit.

### 1. Open the database

```js
const db = new KVDatabase("plugins/MyPlugin/data");
```

The path is a folder; it is created if needed. If a database is already there, it is opened. If the database cannot be
opened, the constructor returns `Null`.

### 2. Write and read values

`db.set(name, value)` stores a value, `db.get(name)` returns it (`Null` if there is none), `db.delete(name)` removes
it and `db.listKey()` returns all the names. The values can be numbers, strings, booleans, arrays and objects. This
plugin counts each player's visits under their XUID:

```js
mc.listen("onJoin", (player) => {
    const key = `visits.${player.xuid}`;
    const visits = (db.get(key) ?? 0) + 1;
    db.set(key, visits);
    player.tell(`This is your visit number ${visits}.`);
});
```

Store players under their XUID (`player.xuid`) rather than their name.

### 3. Close it when the plugin unloads

```js
ll.onUnload(() => {
    db.close();
});
```

Do not use the database after `close`. See the [Database API](../apis/DataAPI/DataBase.md).

## SQL databases

For data in tables, open a SQL session with `new DBSession(type, params)`: `"sqlite3"` for a database file, `"mysql"`
for a MySQL server. Use prepared statements for values that come from players:

```js
const session = new DBSession("sqlite3", { path: "plugins/MyPlugin/data.db" });
session.exec("CREATE TABLE IF NOT EXISTS visits (xuid TEXT, time TEXT)");

mc.listen("onJoin", (player) => {
    const stmt = session.prepare("INSERT INTO visits VALUES (?, ?)");
    stmt.bind([player.xuid, system.getTimeStr()]);
    stmt.execute();
});
```

The functions of the SQL API throw an error when they fail: use `try … catch` in JavaScript and `pcall` in Lua. The
[Database API](../apis/DataAPI/DataBase.md) describes the connection parameters, `session.query` and the statements.

## Other places for data

- [Player data](../apis/DataAPI/PlayerData.md): look up players who are not online, by name or XUID.
- [Economy](../apis/DataAPI/Economy.md): the money of the players.
- [File API](../apis/SystemAPI/File.md): read and write any file yourself.
