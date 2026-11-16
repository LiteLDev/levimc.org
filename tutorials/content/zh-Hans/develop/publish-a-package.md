# 用 lip 发布你的模组

完成本教程后，你的模组会在 GitHub 上有第一个发布版本，任何人都能用一条命令 `lip install github.com/<you>/my-mod` 把它装到自己的服务器上。你将在 `lip.toml` 中描述模组，让 GitHub Actions 构建发布版本，确认 `lip` 能看到它，在自己的服务器上安装它，并让它上架 [LeviMC 模组](https://levimc.org/zh-Hans/mods/)。

大约需要半小时，大部分时间在等待发布构建。

## 你需要准备

- 一个由模组模板创建、能够构建的公开 GitHub 仓库中的模组：见[你的第一个 LeviLamina 模组](first-levilamina-mod.md)。本教程把仓库称为 `github.com/<you>/my-mod`。
- `lip` 和一个用于测试的服务器：见[开你的第一个服务器](../server/first-server.md)。本教程使用 `D:\servers\survival`。
- 已登录 GitHub、可以推送的 Git。

::: warning 需要 lip 0.41
本教程的 `lip pkg …` 命令随 lip 0.41 提供，在正式版发布前它还是预发布版本（lip 0.40 没有这些命令）。用 `lip -v` 检查版本，需要时从 [lip 的发布页](https://github.com/LiteLDev/lip/releases)安装最新的 0.41。
:::

**包**是 `lip` 能安装的任何东西。它的**包 ID** 是仓库地址去掉 `https://`：`github.com/<you>/my-mod`。一个**版本**就是一个名为 `v` 加版本号的 Git 标签，例如 `v0.1.0`，并且该标签处的 `lip.toml` 写着同样的版本。没有上传这一步：发布就是推送这个标签。

## 1. 填写 lip.toml

模板自带一个 `lip.toml`，它告诉 `lip` 要安装什么。打开它，修改下面这些字段，其余保持不变。

```toml
format = 4
id = "github.com/<you>/my-mod"          # 包 ID：你的仓库
version = "0.1.0"                       # 即将发布的版本，不带 "v"

[info]                                  # 显示在 LeviMC 模组和 LeviLauncher 中；lip 忽略它
name = "My Mod"
description = "Says hello."
tags = ["utility"]
logo = "https://avatars.githubusercontent.com/u/<your user id>"
```

然后，在两个 `[[variants.""]]` 条目中（一个是 `side = "server"`，一个是 `side = "client"`）：

- 在 `deps` 中设置模组适用的 LeviLamina 版本范围。服务端条目使用 `"26.60.*"` 这样的范围，与你在 `xmake.lua` 中固定的版本一致。客户端范围请保留其注释和写法。
- 在 `urls` 中，把 `levilamina-mod-template` 换成**你的仓库名**：发布工作流上传的是 `<仓库名>-server-windows-x64.zip` 和 `<仓库名>-client-windows-x64.zip`。
- 在 `place` 中，把 `src` 和 `dest` 里的 `my-mod` 换成 `xmake.lua` 中的 **target 名**：每个 ZIP 文件里都有文件夹 `<target>/`，它会被放到 `mods/<target>/`。

如果你的模组只用于服务端，请删除整个客户端条目：即 `side = "client"` 的 `[[variants.""]]` 以及它下面的 `deps` 和 `assets`。

::: tip `{{id}}` 和 `{{version}}`
`lip.toml` 中的每个字符串都是模板。`{{version}}` 会变成上面的 `version`，所以新的发布只需要修改 `version`。`{{id}}` 会变成包 ID。
:::

::: details 没有 lip.toml 或只有 tooth.json 的仓库
对于不是由模板创建的仓库，在其根目录运行 `lip pkg init`：它会询问包 ID，并写入一个最小的 `lip.toml`，再按上面的方式填写。lip v0.x 的 `tooth.json` 用 `lip pkg migrate` 转换；见[迁移包](https://levimc.org/zh-Hans/lip/authors/migrating_packages.html)。
:::

## 2. 确认 lip 能读取它

在仓库文件夹中运行：

```shell
lip pkg view .
```

你应该看到一段 JSON：`manifest` 下是你的 `id` 和 `version`，以及已填好模板的 `urls`，例如 `https://github.com/<you>/my-mod/releases/download/v0.1.0/my-mod-server-windows-x64.zip`。检查这些名字与你的仓库一致。如果文件有错，`lip` 会告诉你哪里不对。

## 3. 编写更新日志

发布工作流会把 `CHANGELOG.md` 中最新的一节复制到发布说明中。按 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的格式为这个版本添加一节：

```md
## [0.1.0] - 2026-11-16

### Added

- The `/hello` command.
```

提交并推送所有改动：

```shell
git add -A
git commit -m "Release 0.1.0"
git push
```

## 4. 创建发布版本

1. 在 GitHub 上你的仓库页面中，打开 **Releases** → **Draft a new release**。
2. 在 **Choose a tag** 中输入 `v0.1.0`，选择 **Create new tag: v0.1.0 on publish**。目标是默认分支，也就是你刚推送的提交。
3. 给发布起个标题，例如 `0.1.0`，然后点击 **Publish release**。
4. 打开 **Actions** 标签页。发布触发了一次工作流运行：它构建服务端和客户端模组，然后上传。等到它出现绿色对勾（几分钟）。
5. 再次打开这个发布。你应该在 **Assets** 下看到两个文件：`my-mod-server-windows-x64.zip` 和 `my-mod-client-windows-x64.zip`，发布说明是你的更新日志。

::: warning 标签必须与 `version` 一致
标签是 `v` 加完整的[语义化版本](https://semver.org/lang/zh-CN/)：`v0.1.0`，而不是 `0.1.0` 或 `v0.1`。在标签 `v0.1.0` 处，`lip.toml` 必须写着 `version = "0.1.0"`，否则 `lip`、LeviMC 模组和 LeviLauncher 都会跳过这个标签。
:::

## 5. 确认 lip 能看到这个版本

在任意文件夹中运行：

```shell
lip pkg view github.com/<you>/my-mod
```

你应该在末尾看到 `"versions": ["0.1.0"]`，`manifest` 下是你打标签的那个 `lip.toml`。

## 6. 像用户一样安装它

1. 停止服务器。如果上一个教程留下的 `mods\my-mod` 还在，请删除这个文件夹，确保你测试的只是 `lip` 安装的内容。
2. 在服务器文件夹中安装你的包：

   ```shell
   cd D:\servers\survival
   lip install github.com/<you>/my-mod
   lip list
   ```

   `lip list` 应该显示 `github.com/<you>/my-mod@0.1.0`。

3. 启动服务器。你应该再次看到 `Hello from my first mod!`，这次来自 `lip` 下载的文件。

模组上架后（第 7 步），玩家可以用 LeviLauncher 安装同一个包的客户端构建：见[在 Windows 上玩模组](../play/play-with-mods.md)。

## 7. 上架 LeviMC 模组

[LeviMC 模组](https://levimc.org/zh-Hans/mods/)是 `lip` 的「获取模组」页和 LeviLauncher 显示的目录。它由一份仓库列表构建，即 levimc.org 仓库中的 [`mods/repos.txt`](https://github.com/LiteLDev/liteldev.github.io/blob/main/mods/repos.txt)。

通常你什么都不用做：每两小时会有一个机器人在 GitHub 上搜索带有 `lip.toml` 和 `lip` 能读取的版本标签的仓库，并发起拉取请求把它们加入列表。维护者合并后，模组会在下一次每小时构建中出现。

想更快上架，可以自己发起这个拉取请求：在 GitHub 上编辑 [`mods/repos.txt`](https://github.com/LiteLDev/liteldev.github.io/blob/main/mods/repos.txt)，添加一行 `<you>/my-mod`。

目录收录一个包的条件是：

- 它的最新版本依赖 LeviLamina，直接依赖或通过其他包依赖均可；
- 它把文件放到 `mods/`（或 `plugins/`，或游戏加载附加包的位置）；
- 仓库不是 GitHub 模板，名字也不以 `-template`、`-example`、`-demo`、`-sample` 或 `-test` 结尾。

之后你应该能在 `https://levimc.org/zh-Hans/mods/github.com/<you>/my-mod/` 找到你的模组，页面上有它的名字、描述、图标、标签和安装命令。

## 发布下一个版本

1. 把 `lip.toml` 中的 `version` 改高，例如 `0.2.0`，并在 `CHANGELOG.md` 中添加对应的一节。提交并推送。
2. 按第 4 步创建发布 `v0.2.0`。
3. 在服务器上，`lip update github.com/<you>/my-mod` 会安装新版本。

## 你现在有了什么

- 你的模组在 GitHub 上的一个发布版本，由 GitHub Actions 构建。
- 一个可以用 `lip install github.com/<you>/my-mod` 安装的包，带有对 LeviLamina 的依赖。
- 列表收录后，你的模组会出现在 LeviMC 模组上。

## 下一步

- `lip.toml` 的所有字段：依赖、变体、要保留或删除的文件、钩子：[lip.toml](https://levimc.org/zh-Hans/lip/concepts/lip_toml.html)。
- 包作者使用的命令：[`lip pkg init`](https://levimc.org/zh-Hans/lip/reference/commands/pkg_init.html)、[`lip pkg pack`](https://levimc.org/zh-Hans/lip/reference/commands/pkg_pack.html)、[`lip pkg view`](https://levimc.org/zh-Hans/lip/reference/commands/pkg_view.html)、[`lip pkg migrate`](https://levimc.org/zh-Hans/lip/reference/commands/pkg_migrate.html)。
- 在发布前安装某个分支或提交：[管理包](https://levimc.org/zh-Hans/lip/guides/managing_packages.html)。
- `lip` 界面中的同类工具：[工具](https://levimc.org/zh-Hans/lip/interface/tools.html)。
- 服务器如何安装你的包：[给服务器安装模组](../server/install-mods.md)。
