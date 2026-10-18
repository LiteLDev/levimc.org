---
layout: showcase
title: Component showcase
description: Every levimc-kit component, admonition type and content block in one place.
---

# Component showcase

Everything below the gallery is ordinary Markdown, rendered at build time by the docs engine.

## Admonitions (MkDocs)

!!! note
    **Note** — book & quill. Body text with `inline code` and a [link](user_guides/install.md).

!!! abstract "Abstract with a custom title"
    Summaries and TL;DRs use the paper sprite.

!!! info
    Info uses the compass.

!!! tip
    Tips are emeralds.

!!! success
    Success is a diamond.

!!! question "Question?"
    Questions get a pixel question mark.

!!! warning
    Warnings carry a torch.

!!! failure
    Failure is TNT.

!!! danger
    Danger is TNT, too.

!!! bug
    Bugs are bugs.

!!! example
    Examples brew a potion.

!!! quote
    Quotes are quiet.

!!! warning ""
    An explicit empty title renders no title row.

??? tip "Collapsible (closed)"
    Opened with a click. Contains a list:

    - one
    - two

???+ note "Collapsible (open), with a nested admonition"
    !!! danger "Nested"
        Nested admonitions keep their own frame.

## Containers (VitePress & GitHub)

::: tip
VitePress `::: tip` with the default title.
:::

::: info Custom title
`::: info Custom title`
:::

::: warning
VitePress warning.
:::

::: danger
VitePress danger.
:::

::: details Click to expand
Hidden details.
:::

> [!NOTE]
> GitHub alert syntax is supported too.

## Content tabs

=== "C++"

    ```cpp
    #include "ll/api/mod/NativeMod.h"

    namespace my_mod {
    bool MyMod::load() {
        getSelf().getLogger().info("Loading...");
        return true;
    }
    } // namespace my_mod
    ```

=== "JavaScript"

    ```js
    mc.listen("onJoin", (pl) => {
        pl.tell(`Welcome, ${pl.realName}!`);
    });
    ```

=== "Lua"

    ```lua
    mc.listen("onJoin", function(pl)
        pl:tell("Welcome, " .. pl.realName .. "!")
    end)
    ```

## Code

```json title="manifest.json"
{
  "name": "my-mod",
  "entry": "my-mod.dll",
  "type": "native",
  "version": "1.0.0"
}
```

```shell
lip install github.com/LiteLDev/LeviLamina
```

```text
A plain block without highlighting.
```

## Table

| Sprite | Admonition | Colour |
|--------|------------|--------|
| Book & quill | `note` | pond blue |
| Emerald | `tip` | lily green |
| Torch | `warning` | ochre |
| TNT | `danger`, `failure` | redstone |

## Stress test: long strings

A very long URL: [https://github.com/LiteLDev/LeviLamina/blob/develop/src/mc/network/packet/TextPacketPayload/TextPacketMessageType/LongNameThatKeepsGoing.h](https://github.com/LiteLDev/LeviLamina/blob/develop/src/mc/network/packet/TextPacketPayload/TextPacketMessageType/LongNameThatKeepsGoing.h)

A long identifier: `ll::event::player::PlayerInteractBlockEventWithAVeryLongNameThatDoesNotWrapNaturally`

🧱🧱🧱 超长的中文段落没有任何空格用于测试在三百九十像素宽度的移动设备上是否能够正确换行而不会撑破布局或者产生横向滚动条🌸🌸🌸

!!! tip "A long admonition title that keeps going: `ll::service::PlayerInfo::getInstance().fromUuidWithAVeryLongSuffix`"
    Body.

### `PlayerInteractBlockEventWithAVeryLongNameThatDoesNotWrapNaturally::getBlockPos`

## Lists, quotes, keys

1. Ordered lists keep their numbers.
2. Second step with **bold** and *italic* text.
    - Nested bullet (four-space indent).
    - Another one.

- [x] Task lists
- [ ] Unchecked task

> A blockquote, tinted with wisteria.

Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search. A footnote reference[^1].

[^1]: Footnotes are collected at the end of the page.
