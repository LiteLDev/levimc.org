# lip uninstall

卸载包。

## 概要

```shell
lip uninstall <PACKAGES> [options]
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<PACKAGES>` | 要卸载的包，格式为包标识（`<path>` 或 `<path>#<variant>`）。 |

## 选项

| 选项 | 说明 |
| --- | --- |
| `-n, --dry-run` | 仅模拟执行，不做实际更改。 |
| `--ignore-scripts` | 跳过执行 `pre_uninstall`、`uninstall`、`post_uninstall` 脚本。 |
| `--no-dependencies` | 跳过移除依赖。 |
