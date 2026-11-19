---
platforms: [windows]
---
# 폴더 및 파일

LeviLauncher 1.1.0 기준으로 Windows 버전 LeviLauncher가 읽고 쓰는 모든 파일과 폴더입니다. 런처는 시스템 임시 폴더(`%TEMP%`)에 아무것도 쓰지 않습니다.

## 개요

| 폴더 | 위치 | 내용 |
| --- | --- | --- |
| 설정 폴더 | `%APPDATA%\LeviLauncher\` | `config.json`만: 작고, Windows 프로필과 함께 로밍됨 |
| 로컬 폴더 | `%LOCALAPPDATA%\LeviLauncher\` | 로그, Microsoft 계정, 창의 WebView2 데이터. 기본 데이터 루트이기도 함 |
| 데이터 루트 | 다른 곳을 고르지 않는 한 로컬 폴더(**설정 → 일반 설정**의 **기본 루트**, 또는 `config set data-root`) | `Instances\`, `Backups\`, `Cache\` |

```text
%APPDATA%\LeviLauncher\
  config.json                      런처 설정
%LOCALAPPDATA%\LeviLauncher\        기본 데이터 루트
  Logs\startup.log                 런처 로그, 그 이전의 startup.1.log … startup.4.log
  Accounts\                        Microsoft 계정과 기기 기록, 현재 Windows 사용자용으로 암호화됨
  WebView2\                        런처 창의 데이터
  storage-migration.json           이전 레이아웃에서 옮긴 기록(아래 참조)
<데이터 루트>\
  Instances\<인스턴스>\             인스턴스 하나(아래 참조)
  Backups\
    Worlds\<인스턴스>\<폴더>_<월드>\<월드>_<yyyyMMdd-HHmmss>.mcworld
    Instances\<인스턴스>\<인스턴스>_<yyyyMMdd-HHmmss>.zip
  Cache\
    Installers\                    게임 설치 패키지와 Visual C++, WebView2 설치 프로그램
    Updates\                       런처 업데이트. 설치 후 삭제됨
    Downloads\                     가져오기용으로 다운로드한 파일. 1일이 지나면 시작 시 정리됨
    Imports\                       가져오기에 넘겨진 파일. 1일이 지나면 시작 시 정리됨
    gdk-pending-versions.json
    gamertags.json                 런처가 본 플레이어 프로필의 게이머태그
```

`Cache\`의 모든 내용은 아무것도 잃지 않고 삭제할 수 있습니다. `LeviLauncher.exe cache clean`은 패키지 캐시, 가져오기용으로 다운로드한 파일, 완료되지 않은 다운로드를 삭제하고, `LeviLauncher.exe installer remove`는 다운로드한 게임 설치 패키지를 삭제합니다. 데이터 루트를 바꾸면 런처가 다른 폴더를 가리킬 뿐이며, 기존 인스턴스, 다운로드, 백업은 옮겨지지 않습니다.

## 인스턴스 폴더

```text
Instances\<인스턴스>\
  Minecraft.Windows.exe …          빌드의 게임 파일
  LeviLauncher.dll                 LeviLauncher의 네이티브 로더(x64 빌드)
  .levilauncher\                   인스턴스 안의 런처 상태(숨김)
    instance.json                  이름, 게임 버전, 채널, 격리, 실행 옵션
    icon.ico                       게임의 LargeLogo.png로 만든 인스턴스 아이콘
    xbox-auth-key-v1               Xbox 로그인을 위한 UWP 인스턴스의 표시
  .lip\                            인스턴스에 설치된 패키지의 상태(lip 형식)
  mods\                            모드("모드 로드 방식" 참조)
  Minecraft Bedrock\               격리가 켜져 있을 때의 게임 데이터(프리뷰: Minecraft Bedrock Preview)
```

격리 여부에 따른 인스턴스의 게임 데이터 폴더는 [인스턴스 격리](../concepts/isolation)를, `mods\`는 [모드 로드 방식](../concepts/mod-loading)을 참조하세요.

## LeviLauncher 폴더 밖

| 경로 | 설명 |
| --- | --- |
| 바탕 화면의 `Minecraft - <인스턴스>.lnk` | 인스턴스의 바탕 화면 바로 가기(**바탕 화면 바로 가기 만들기**, 또는 `instance shortcut`). `--launch=<인스턴스>`로 런처를 엽니다. 공용 바탕 화면이 아니라 자신의 바탕 화면에만 씁니다. |
| `%APPDATA%\lip\` | lip의 설정: `config.toml`, 예를 들어 내장 패키지 관리자도 읽는 `github_proxy`. |
| `%LOCALAPPDATA%\lip\Cache\` | 내장 패키지 관리자의 패키지 캐시로, lip의 것과 같습니다. **설정 → 패키지 관리**의 **캐시 지우기**가 이를 비웁니다. |
| `%APPDATA%\Minecraft Bedrock\`, `%APPDATA%\Minecraft Bedrock Preview\` | 격리하지 않은 GDK 인스턴스의 공유 게임 데이터. |
| `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\`(프리뷰: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) | 격리하지 않은 UWP 인스턴스의 공유 게임 데이터. |

## 파일을 쓰는 방식

- 파일은 최종 위치 옆에 `<이름>.<임의 문자열>.tmp`로 쓴 다음 제자리로 이름을 바꾸므로, 반쯤 쓰인 파일이 보이는 일이 없습니다. 이어받을 수 있는 미완료 다운로드는 `<이름>.partial.tmp`로 보관됩니다.
- 사용자가 정한 이름(인스턴스, 월드)은 Windows 규칙에 따라 정리됩니다. `<>:"/\|?*` 문자와 끝의 점과 공백을 제거하고, `CON`, `NUL` 같은 예약된 이름을 피합니다.
- 런처가 만드는 파일의 이름은 `<이름>_<yyyyMMdd-HHmmss>.<확장자>`입니다. 예: `MyWorld_20261107-142301.mcworld`.

## 이전 레이아웃

1.1.0 이전의 LeviLauncher는 모든 것을 `%APPDATA%\<프로그램 이름>\`(예: `%APPDATA%\levilauncher.exe\`)에 두었으며, 그 안에 `versions\`, `backups\`, `installers\`, `updates\`, `logs\` 폴더와 `config.json`, `user_gamertag_map.json`, `gdk_pending_versions.json` 파일이 있었습니다. 인스턴스에는 `version.json`과 `LargeLogo.ico`가 있었습니다.

LeviLauncher 1.1.0 이상은 처음 시작할 때 이 데이터를 위의 레이아웃으로 한 번 옮기며, 아무것도 삭제하지 않습니다. 같은 드라이브의 데이터는 제자리로 이름을 바꾸고, 다른 드라이브의 데이터는 복사한 뒤 원본을 보존하며, 이전 `config.json`은 `config.migrated.json`으로 이름이 바뀝니다. 직접 고른 데이터 루트는 그 자리에 그대로 둡니다. 옮길 수 없는 것이 있으면(예: 게임이 인스턴스에서 실행 중일 때) 모든 단계를 되돌리고, 런처는 다음 시작 때까지 이전 레이아웃으로 실행됩니다. `storage-migration.json`에 무엇을 어디로 옮겼는지 기록되며, 그 후 바탕 화면 바로 가기가 새 위치로 업데이트됩니다.
