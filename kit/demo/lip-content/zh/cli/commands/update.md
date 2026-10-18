# lip update

更新包。

## 概要

```shell
lip update <PACKAGES> [options]
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<PACKAGES>` | 要更新的包。支持与 [`lip install`](./install.md#参数) 相同的格式。 |

## 选项

| 选项 | 说明 |
| --- | --- |
| `-n, --dry-run` | 仅模拟执行，不做实际更改。 |
| `--ignore-scripts` | 更新时跳过安装与卸载生命周期脚本。 |
