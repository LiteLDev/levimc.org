// The sections of levimc.org/faq/ and the tree of each: one entry per page of content/ (and content/zh-Hans/).
import type { NavEntry } from './kit/docs/node/config.ts';

export const NAV: Record<'en' | 'zh-Hans', NavEntry[]> = {
  en: [
    {
      "text": "Run a server",
      "items": [
        {
          "text": "LeviLamina",
          "items": [
            {
              "text": "Installation",
              "link": "/server/levilamina/install/"
            },
            {
              "text": "Versions and compatibility",
              "link": "/server/levilamina/versions/"
            },
            {
              "text": "Configuration",
              "link": "/server/levilamina/configuration/"
            },
            {
              "text": "Features",
              "link": "/server/levilamina/features/"
            },
            {
              "text": "Errors and crashes",
              "link": "/server/levilamina/errors/"
            },
            {
              "text": "Performance and more",
              "link": "/server/levilamina/more/"
            }
          ]
        },
        {
          "text": "lip",
          "items": [
            {
              "text": "Basics",
              "link": "/server/lip/basics/"
            },
            {
              "text": "Installing and setting up",
              "link": "/server/lip/install/"
            },
            {
              "text": "Using lip",
              "link": "/server/lip/usage/"
            },
            {
              "text": "Errors",
              "link": "/server/lip/errors/"
            }
          ]
        },
        {
          "text": "Docker images",
          "link": "/server/docker/"
        },
        {
          "text": "Server mods",
          "items": [
            {
              "text": "LeviAntiCheat",
              "link": "/server/mods/levianticheat/"
            },
            {
              "text": "LeviOptimize",
              "link": "/server/mods/levioptimize/"
            },
            {
              "text": "LeviStone",
              "link": "/server/mods/levistone/"
            },
            {
              "text": "MoreDimensions",
              "link": "/server/mods/moredimensions/"
            },
            {
              "text": "LegacyMoney",
              "link": "/server/mods/legacymoney/"
            },
            {
              "text": "Other projects",
              "link": "/server/mods/others/"
            }
          ]
        }
      ]
    },
    {
      "text": "Play",
      "items": [
        {
          "text": "LeviLauncher basics",
          "link": "/play/levilauncher/"
        },
        {
          "text": "LeviLauncher on Windows",
          "items": [
            {
              "text": "Installing and updating",
              "link": "/play/windows/install/"
            },
            {
              "text": "Features and settings",
              "link": "/play/windows/usage/"
            },
            {
              "text": "Versions and compatibility",
              "link": "/play/windows/versions/"
            },
            {
              "text": "Errors and crashes",
              "link": "/play/windows/errors/"
            }
          ]
        },
        {
          "text": "LeviLauncher on Android",
          "items": [
            {
              "text": "Installing",
              "link": "/play/android/install/"
            },
            {
              "text": "Features and settings",
              "link": "/play/android/usage/"
            },
            {
              "text": "Versions and compatibility",
              "link": "/play/android/versions/"
            },
            {
              "text": "Errors and crashes",
              "link": "/play/android/errors/"
            }
          ]
        }
      ]
    },
    {
      "text": "Make mods",
      "items": [
        {
          "text": "LeviLamina mods (C++)",
          "items": [
            {
              "text": "General",
              "link": "/develop/levilamina/basics/"
            },
            {
              "text": "Building and toolchain",
              "link": "/develop/levilamina/build/"
            },
            {
              "text": "Errors and crashes",
              "link": "/develop/levilamina/errors/"
            }
          ]
        },
        {
          "text": "LeviLamina API",
          "items": [
            {
              "text": "Commands",
              "link": "/develop/levilamina/api-commands/"
            },
            {
              "text": "Events",
              "link": "/develop/levilamina/api-events/"
            },
            {
              "text": "Hooks and memory",
              "link": "/develop/levilamina/api-hooks/"
            },
            {
              "text": "Players and entities",
              "link": "/develop/levilamina/api-players/"
            },
            {
              "text": "World, blocks and items",
              "link": "/develop/levilamina/api-world/"
            },
            {
              "text": "Forms, packets and network",
              "link": "/develop/levilamina/api-ui-network/"
            },
            {
              "text": "Data, config and i18n",
              "link": "/develop/levilamina/api-data/"
            },
            {
              "text": "Threads, scheduling and lifecycle",
              "link": "/develop/levilamina/api-runtime/"
            },
            {
              "text": "Other APIs",
              "link": "/develop/levilamina/api-misc/"
            }
          ]
        },
        {
          "text": "iListenAttentively",
          "link": "/develop/ilistenattentively/"
        }
      ]
    },
    {
      "text": "Script plugins",
      "items": [
        {
          "text": "LegacyScriptEngine",
          "items": [
            {
              "text": "General",
              "link": "/scripts/lse/basics/"
            },
            {
              "text": "Installing, configuring, versions",
              "link": "/scripts/lse/install/"
            },
            {
              "text": "Errors and crashes",
              "link": "/scripts/lse/errors/"
            },
            {
              "text": "Performance and tooling",
              "link": "/scripts/lse/performance/"
            }
          ]
        },
        {
          "text": "LegacyScriptEngine API",
          "items": [
            {
              "text": "Players",
              "link": "/scripts/lse/api-players/"
            },
            {
              "text": "Entities",
              "link": "/scripts/lse/api-entities/"
            },
            {
              "text": "Items and containers",
              "link": "/scripts/lse/api-items/"
            },
            {
              "text": "World and blocks",
              "link": "/scripts/lse/api-world/"
            },
            {
              "text": "Forms and on-screen text",
              "link": "/scripts/lse/api-forms/"
            },
            {
              "text": "Commands",
              "link": "/scripts/lse/api-commands/"
            },
            {
              "text": "Events",
              "link": "/scripts/lse/api-events/"
            },
            {
              "text": "Data and files",
              "link": "/scripts/lse/api-data/"
            },
            {
              "text": "Network and system",
              "link": "/scripts/lse/api-network/"
            },
            {
              "text": "Engines, modules and timers",
              "link": "/scripts/lse/api-runtime/"
            },
            {
              "text": "Other APIs",
              "link": "/scripts/lse/api-misc/"
            }
          ]
        },
        {
          "text": "LegacyRemoteCall",
          "link": "/scripts/legacyremotecall/"
        }
      ]
    }
  ],
  'zh-Hans': [
    {
      "text": "开服",
      "items": [
        {
          "text": "LeviLamina",
          "items": [
            {
              "text": "安装与部署",
              "link": "/zh-Hans/server/levilamina/install/"
            },
            {
              "text": "版本与兼容性",
              "link": "/zh-Hans/server/levilamina/versions/"
            },
            {
              "text": "配置",
              "link": "/zh-Hans/server/levilamina/configuration/"
            },
            {
              "text": "功能与用法",
              "link": "/zh-Hans/server/levilamina/features/"
            },
            {
              "text": "报错与崩溃",
              "link": "/zh-Hans/server/levilamina/errors/"
            },
            {
              "text": "性能与其他",
              "link": "/zh-Hans/server/levilamina/more/"
            }
          ]
        },
        {
          "text": "lip",
          "items": [
            {
              "text": "基础",
              "link": "/zh-Hans/server/lip/basics/"
            },
            {
              "text": "安装与部署",
              "link": "/zh-Hans/server/lip/install/"
            },
            {
              "text": "使用与配置",
              "link": "/zh-Hans/server/lip/usage/"
            },
            {
              "text": "报错",
              "link": "/zh-Hans/server/lip/errors/"
            }
          ]
        },
        {
          "text": "Docker 镜像",
          "link": "/zh-Hans/server/docker/"
        },
        {
          "text": "服务器模组",
          "items": [
            {
              "text": "LeviAntiCheat",
              "link": "/zh-Hans/server/mods/levianticheat/"
            },
            {
              "text": "LeviOptimize",
              "link": "/zh-Hans/server/mods/levioptimize/"
            },
            {
              "text": "LeviStone",
              "link": "/zh-Hans/server/mods/levistone/"
            },
            {
              "text": "MoreDimensions",
              "link": "/zh-Hans/server/mods/moredimensions/"
            },
            {
              "text": "LegacyMoney",
              "link": "/zh-Hans/server/mods/legacymoney/"
            },
            {
              "text": "其他项目",
              "link": "/zh-Hans/server/mods/others/"
            }
          ]
        }
      ]
    },
    {
      "text": "游玩",
      "items": [
        {
          "text": "LeviLauncher 基础",
          "link": "/zh-Hans/play/levilauncher/"
        },
        {
          "text": "Windows 版 LeviLauncher",
          "items": [
            {
              "text": "安装与更新",
              "link": "/zh-Hans/play/windows/install/"
            },
            {
              "text": "功能与设置",
              "link": "/zh-Hans/play/windows/usage/"
            },
            {
              "text": "版本与兼容性",
              "link": "/zh-Hans/play/windows/versions/"
            },
            {
              "text": "报错与崩溃",
              "link": "/zh-Hans/play/windows/errors/"
            }
          ]
        },
        {
          "text": "Android 版 LeviLauncher",
          "items": [
            {
              "text": "安装",
              "link": "/zh-Hans/play/android/install/"
            },
            {
              "text": "功能与设置",
              "link": "/zh-Hans/play/android/usage/"
            },
            {
              "text": "版本与兼容性",
              "link": "/zh-Hans/play/android/versions/"
            },
            {
              "text": "报错与崩溃",
              "link": "/zh-Hans/play/android/errors/"
            }
          ]
        }
      ]
    },
    {
      "text": "开发模组",
      "items": [
        {
          "text": "LeviLamina 模组（C++）",
          "items": [
            {
              "text": "综合",
              "link": "/zh-Hans/develop/levilamina/basics/"
            },
            {
              "text": "构建与工具链",
              "link": "/zh-Hans/develop/levilamina/build/"
            },
            {
              "text": "报错与崩溃",
              "link": "/zh-Hans/develop/levilamina/errors/"
            }
          ]
        },
        {
          "text": "LeviLamina API",
          "items": [
            {
              "text": "命令",
              "link": "/zh-Hans/develop/levilamina/api-commands/"
            },
            {
              "text": "事件",
              "link": "/zh-Hans/develop/levilamina/api-events/"
            },
            {
              "text": "Hook 与内存",
              "link": "/zh-Hans/develop/levilamina/api-hooks/"
            },
            {
              "text": "玩家与实体",
              "link": "/zh-Hans/develop/levilamina/api-players/"
            },
            {
              "text": "世界、方块与物品",
              "link": "/zh-Hans/develop/levilamina/api-world/"
            },
            {
              "text": "表单、数据包与网络",
              "link": "/zh-Hans/develop/levilamina/api-ui-network/"
            },
            {
              "text": "数据、配置与多语言",
              "link": "/zh-Hans/develop/levilamina/api-data/"
            },
            {
              "text": "线程、调度与生命周期",
              "link": "/zh-Hans/develop/levilamina/api-runtime/"
            },
            {
              "text": "其他 API",
              "link": "/zh-Hans/develop/levilamina/api-misc/"
            }
          ]
        },
        {
          "text": "iListenAttentively",
          "link": "/zh-Hans/develop/ilistenattentively/"
        }
      ]
    },
    {
      "text": "脚本插件",
      "items": [
        {
          "text": "LegacyScriptEngine",
          "items": [
            {
              "text": "综合",
              "link": "/zh-Hans/scripts/lse/basics/"
            },
            {
              "text": "安装、配置与版本",
              "link": "/zh-Hans/scripts/lse/install/"
            },
            {
              "text": "报错与崩溃",
              "link": "/zh-Hans/scripts/lse/errors/"
            },
            {
              "text": "性能与开发工具",
              "link": "/zh-Hans/scripts/lse/performance/"
            }
          ]
        },
        {
          "text": "LegacyScriptEngine API",
          "items": [
            {
              "text": "玩家",
              "link": "/zh-Hans/scripts/lse/api-players/"
            },
            {
              "text": "实体",
              "link": "/zh-Hans/scripts/lse/api-entities/"
            },
            {
              "text": "物品与容器",
              "link": "/zh-Hans/scripts/lse/api-items/"
            },
            {
              "text": "世界与方块",
              "link": "/zh-Hans/scripts/lse/api-world/"
            },
            {
              "text": "表单与界面显示",
              "link": "/zh-Hans/scripts/lse/api-forms/"
            },
            {
              "text": "命令",
              "link": "/zh-Hans/scripts/lse/api-commands/"
            },
            {
              "text": "事件",
              "link": "/zh-Hans/scripts/lse/api-events/"
            },
            {
              "text": "数据与文件",
              "link": "/zh-Hans/scripts/lse/api-data/"
            },
            {
              "text": "网络与系统",
              "link": "/zh-Hans/scripts/lse/api-network/"
            },
            {
              "text": "引擎、模块与定时器",
              "link": "/zh-Hans/scripts/lse/api-runtime/"
            },
            {
              "text": "其他 API",
              "link": "/zh-Hans/scripts/lse/api-misc/"
            }
          ]
        },
        {
          "text": "LegacyRemoteCall",
          "link": "/zh-Hans/scripts/legacyremotecall/"
        }
      ]
    }
  ],
};
