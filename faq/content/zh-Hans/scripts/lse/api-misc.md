# LegacyScriptEngine API：其他 API

## LSE JS 插件中打印查询结果输出 `[object Object]`，用 `String()` 也一样，怎么打印出对象内容？

结果是一个普通对象，`String()`/`toString()` 只会得到 `[object Object]`。应先用 `JSON.stringify(results)` 转成 JSON 字符串再打印，例如 `logger.info(JSON.stringify(results))`。

*适用版本：当前版本（JS 引擎）*

## LSE 插件中调用 GMLIB 提供的 `PAPI.GetValueWithPlayer`（传 xuid）获取占位符值不生效，正确的 PAPI 翻译写法是什么？

不要逐个提取占位符再取值，直接用 `PAPI.translateString(字符串, 玩家对象)`，第二个参数传玩家对象而不是 xuid；不存在 `translateStringWithPlayer`。传入完整字符串，占位符前后的 `%` 要带上，一句话可包含多个占位符并一次性翻译。例如：

```js
PAPI.translateString("玩家名字：%player_name%，服务器mspt：%server_mspt%", pl)
```

此功能依赖第三方的 GMLIB 及其 LSE 导出。

*适用版本：安装了 GMLIB 及其 LSE 导出的服务器。未能从源码或文档中直接证实，仅供参考。*

## LSE 插件里用到的 Minecraft 类是由哪个前置插件提供的？

Minecraft 类不是 LSE 自带的，由第三方前置 GMLIB 的 LSE 导出接口（GMLIB-LegacyRemoteCallApi）提供，需要安装 GMLIB 及其 LSE 支持。

*适用版本：使用 GMLIB 的 LSE 插件。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 下有没有可以在 LSE 插件里使用的非实体悬浮字 API？

LSE 本身没有提供悬浮字 API。可以使用第三方前置 GMLIB 的 LegacyRemoteCall 导出（GMLIB-LRCA），它提供悬浮字 API，LSE 插件可以调用。

*适用版本：需安装第三方 GMLIB 及 GMLIB-LRCA，版本需与当前 LeviLamina 匹配。未能从源码或文档中直接证实，仅供参考。*

## PAPI 变量（如坐标）显示带小数，如何让它不显示小数？

PAPI 内置的这些变量是为兼容 LL2 时代保留的，无法直接修改其格式。建议自己用 PAPI 注册一个玩家变量（如 `registerPlayerPlaceholder`）：传入玩家对象，取坐标后处理成整数字符串返回，例如 `Math.round(x).toString()` 或 `Number(x).toFixed(0)`（四舍五入），需要截断可用 `Math.floor(x)`。

*适用版本：使用第三方 PlaceholderAPI（如 GMLIB-LegacyRemoteCallApi 提供的 PAPI）的 LSE 插件。未能从源码或文档中直接证实，仅供参考。*

## 使用 GMLIB-LegacyRemoteCallApi 提供的 PlaceholderAPI（PAPI）时，如何查看当前所有可用的 PAPI 变量？

在控制台用 LSE（QuickJS 引擎）的 `jsdebug` 调试命令执行：

```shell
jsdebug require('./GMLIB-LegacyRemoteCallApi/lib/BEPlaceholderAPI-JS.js').PAPI.getAllPAPI()
```

即可列出所有已注册的变量（路径以实际安装位置为准）。

*适用版本：安装了第三方 GMLIB-LegacyRemoteCallApi 及 LSE QuickJS 引擎时。未能从源码或文档中直接证实，仅供参考。*
