# LegacyScriptEngine API: other apis

## In an LSE JS plugin, printing a query result outputs `[object Object]`, and `String()` gives the same. How do I print the contents of the object?

The result is a plain object, so `String()`/`toString()` only gives `[object Object]`. Convert it to a JSON string with `JSON.stringify(results)` before printing, for example `logger.info(JSON.stringify(results))`.

*Applies to: current version (JS engine)*

## In an LSE plugin, calling `PAPI.GetValueWithPlayer` from GMLIB (passing an xuid) to get a placeholder value does not work. What is the correct way to translate PAPI placeholders?

Do not extract placeholders one by one and look up their values. Use `PAPI.translateString(string, player object)` directly, and pass the player object, not the xuid, as the second parameter; `translateStringWithPlayer` does not exist. Pass the complete string, keep the `%` around each placeholder, and a single sentence can contain several placeholders that are translated at once. For example:

```js
PAPI.translateString("Player name: %player_name%, server mspt: %server_mspt%", pl)
```

This relies on the third-party GMLIB and its LSE exports.

*Applies to: servers with GMLIB and its LSE exports installed. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Which prerequisite plugin provides the Minecraft class used in LSE plugins?

The Minecraft class is not part of LSE. It is provided by the LSE export interface (GMLIB-LegacyRemoteCallApi) of the third-party prerequisite GMLIB, so you need to install GMLIB and its LSE support.

*Applies to: LSE plugins that use GMLIB. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Under LeviLamina, is there a floating text API (not entity-based) that LSE plugins can use?

LSE itself has no floating text API. You can use the LegacyRemoteCall exports of the third-party dependency GMLIB (GMLIB-LRCA), which provides a floating text API that LSE plugins can call.

*Applies to: requires the third-party GMLIB and GMLIB-LRCA, in a version matching the current LeviLamina. Not confirmed against the source code or the documentation: treat it as a pointer.*

## A PAPI variable (such as coordinates) is displayed with decimals. How do I hide the decimals?

These built-in PAPI variables are kept for compatibility with the LL2 era, and their format cannot be changed directly. Register your own player variable with PAPI (for example with `registerPlayerPlaceholder`): it receives the player object, takes the coordinate, and returns it as an integer string, for example `Math.round(x).toString()` or `Number(x).toFixed(0)` (rounding), or `Math.floor(x)` if you need truncation.

*Applies to: LSE plugins using a third-party PlaceholderAPI (such as the PAPI provided by GMLIB-LegacyRemoteCallApi). Not confirmed against the source code or the documentation: treat it as a pointer.*

## When using the PlaceholderAPI (PAPI) provided by GMLIB-LegacyRemoteCallApi, how do I list all currently available PAPI variables?

In the console, run the `jsdebug` debug command of LSE (QuickJS engine):

```shell
jsdebug require('./GMLIB-LegacyRemoteCallApi/lib/BEPlaceholderAPI-JS.js').PAPI.getAllPAPI()
```

This lists all registered variables (the path depends on where it is actually installed).

*Applies to: with the third-party GMLIB-LegacyRemoteCallApi and the LSE QuickJS engine installed. Not confirmed against the source code or the documentation: treat it as a pointer.*
