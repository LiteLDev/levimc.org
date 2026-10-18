# lip install

安装包。

## 概要

```shell
lip install <PACKAGES> [options]
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<PACKAGES>` | 要安装的包。 |

每个包参数按以下顺序解析：

1. **包规格** — `<path>@<version>`（例如 `github.com/user/repo@1.0.0`）
2. **包标识** — `<path>` 或 `<path>#<variant>`（解析为最新版本）
3. **本地文件** — 本地归档文件路径（例如 `./package.zip`）
4. **远程 URL** — 远程归档 URL（例如 `https://example.com/package.zip`）

可通过 `#<variant>` 追加变体（例如 `github.com/user/repo#my_variant@1.0.0`）。

## 选项

| 选项 | 说明 |
| --- | --- |
| `-n, --dry-run` | 仅模拟执行，不做实际更改。 |
| `--ignore-scripts` | 跳过执行 `pre_install`、`install`、`post_install` 脚本。 |
| `--no-dependencies` | 跳过安装依赖。 |
