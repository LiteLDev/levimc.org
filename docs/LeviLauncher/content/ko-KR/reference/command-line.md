---
platforms: [windows]
---
# 명령줄

인수 없이 `LeviLauncher.exe`를 실행하면 런처 창이 열립니다. 명령을 주면 터미널에서 실행된 뒤 종료하며, 명령은 `<명사> <동사>` 형식을 따릅니다.

```text
LeviLauncher.exe <command> [arguments] [flags]
```

이 페이지는 LeviLauncher 1.1.0의 모든 명령을 나열합니다. `LeviLauncher.exe help <command>`는 각 명령의 플래그와 예제를, `LeviLauncher.exe help`는 개요를 출력합니다. 명령줄의 출력은 영어입니다.

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe play
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe world export "My World" -o D:\Backups
LeviLauncher.exe instance list --json
```

## 셸에서 실행하기

`LeviLauncher.exe`는 창 프로그램이므로 셸은 기본적으로 그것을 기다리지 않습니다. 프롬프트가 돌아오기 전에 출력이 필요하거나 종료 코드가 필요하면:

- cmd에서는 `start /wait LeviLauncher.exe ...`를 쓰고 `%ERRORLEVEL%`을 읽습니다.
- PowerShell에서는 출력을 파이프로 넘기거나(`LeviLauncher.exe instance list | Out-String`) `Start-Process -Wait -NoNewWindow`를 씁니다.

명령줄은 창을 열지 않으며, 창이 열려 있는 동안에도 실행할 수 있습니다.

## 명령

### 일상

| 명령 | 하는 일 |
| --- | --- |
| `play [<instance>]` | 게임을 시작하고 창이 나타날 때까지 기다림(`launch`의 별칭) |
| `install <version\|file>` | Minecraft를 다운로드해 새 인스턴스로 설치(= `instance create`) |
| `use [<instance>]` | 기본 인스턴스를 설정하거나 표시 |
| `stop [<instance>\|<pid>...]` | 실행 중인 Minecraft를 닫음(= `process stop`) |

### 인스턴스 관리

| 명령 | 하는 일 |
| --- | --- |
| `instance list [<filter>]` | 설치된 인스턴스 목록 |
| `instance show [<instance>]` | 인스턴스의 설정, 등록, 로더, 플레이어, 콘텐츠 수를 표시(`instance <instance>`도 가능) |
| `instance create <version\|file>` | Minecraft를 다운로드해 새 인스턴스로 설치 |
| `instance copy-data [<instance>] --from system\|<instance>` | 게임 데이터(월드, 설정)를 자체 데이터를 가진 인스턴스로 복사 |
| `instance rename <instance> <new-name>` | 인스턴스 이름 변경 |
| `instance set [<instance>]` | 인스턴스 설정 변경(콘솔, 편집기 모드, 자체 데이터, 인수, 환경, 로고) |
| `instance remove <instance>...` | 인스턴스와 그 폴더의 모든 것을 영구 삭제 |
| `instance register [<instance>]` | Windows가 이 인스턴스를 해당 채널의 설치된 Minecraft로 취급하게 함 |
| `instance unregister [<instance>]` | 인스턴스의 Windows 등록 해제(게임 데이터는 유지) |
| `instance shortcut [<instance>]` | 인스턴스를 시작하는 바탕 화면 바로 가기를 만들거나 제거 |
| `instance path [<instance>] [<kind>]` | 인스턴스의 폴더를 출력(원하면 열기) |
| `mod list [<filter>]` | 인스턴스의 모드 목록 |
| `mod show <package>` | 카탈로그의 모드를 표시 |
| `mod search [<words>]` | LeviLamina 모드 카탈로그 검색 |
| `mod install <package[@version]>...` | 카탈로그에서 모드를 설치, 업그레이드 또는 다운그레이드 |
| `mod update [<mod>...]` | 카탈로그 모드를 최신 버전으로 업데이트 |
| `mod import <file>...` | `.mcmod`, `.zip`, `.dll` 파일에서 모드 추가 |
| `mod set <mod>` | 모드의 매니페스트 변경 |
| `mod remove <mod>...` | 인스턴스에서 모드 제거 |
| `mod enable <mod>... \| --all` | 모드 켜기 |
| `mod disable <mod>... \| --all` | 모드를 제거하지 않고 끄기 |
| `mod path [<mod>]` | 모드 또는 인스턴스 모드 폴더의 경로 출력 |
| `loader versions` | 게임 버전에 사용할 수 있는 LeviLamina 버전 목록 |
| `loader install [<version>]` | 인스턴스에 LeviLamina를 설치하거나 버전 변경 |
| `loader remove` | 인스턴스에서 LeviLamina 제거 |
| `world list [<filter>]` | 인스턴스와 플레이어의 월드 목록 |
| `world import <file.mcworld>...` | `.mcworld` 파일에서 월드 가져오기 |
| `world export <world>...` | 월드를 `.mcworld` 파일로 내보내기(백업) |
| `world copy <world>...` | 월드를 다른 인스턴스로 복사 |
| `world rename <world> <new-name>` | 월드의 표시 이름 변경 |
| `world get <world> [<key>[/<sub>...]]` | `level.dat`에서 월드 설정 읽기 |
| `world set <world> <key>[/<sub>...]=<value>...` | `level.dat`의 월드 설정 변경 |
| `world remove <world>...` | 월드를 영구 삭제 |
| `pack list [<filter>]` | 리소스 팩, 행동 팩, 스킨 팩 목록 |
| `pack import <file.mcpack\|file.mcaddon>...` | `.mcpack`, `.mcaddon` 파일에서 팩과 애드온 설치 |
| `pack copy <pack>... \| --all` | 팩을 다른 인스턴스로 복사 |
| `pack remove <pack>...` | 설치된 팩 삭제 |
| `screenshot list` | 인스턴스와 플레이어의 스크린샷 목록, 최신순 |
| `screenshot remove <name\|path>... \| --all` | 스크린샷 삭제 |
| `server list [<filter>]` | 저장된 서버 목록과 온라인 여부 확인 |
| `player list` | GDK 인스턴스의 플레이어 프로필 목록 |
| `backup list [<instance>]` | 인스턴스 백업과 월드 백업 목록(미리 보기 기능) |
| `backup create [<instance>]` | 인스턴스의 게임 데이터와 모드 백업(미리 보기 기능) |
| `backup restore [<instance>] <archive.zip>` | 인스턴스 백업 복원(미리 보기 기능) |

### 설치할 것 찾기

| 명령 | 하는 일 |
| --- | --- |
| `installer search [<version>]` | 설치할 수 있는 Minecraft 빌드 목록 |
| `installer download <version>` | 빌드의 설치 패키지를 설치하지 않고 다운로드 |
| `installer list` | 다운로드한 설치 패키지 목록, 완료되지 않은 다운로드 포함 |
| `installer remove <version\|file>...` | 다운로드한 설치 패키지를 삭제해 디스크 공간 확보 |
| `installer mirrors <version>` | GDK 빌드의 다운로드 미러 측정 |
| `curseforge search [<words>]` | CurseForge에서 월드, 애드온, 팩, 스킨 검색(명사의 별칭: `cf`) |
| `curseforge show <id>` | CurseForge 프로젝트 표시 |
| `curseforge categories` | 필터에 쓸 CurseForge 클래스와 카테고리 목록 |
| `curseforge install <id>` | CurseForge 파일을 다운로드해 인스턴스로 가져오기 |

### 이 PC와 런처

| 명령 | 하는 일 |
| --- | --- |
| `process list` | 실행 중인 Minecraft 프로세스 목록, 런처가 시작하지 않은 것 포함(별칭: `ps`) |
| `process stop [<instance>\|<pid>...]` | 실행 중인 Minecraft를 강제 종료(마지막 자동 저장 이후의 진행 상황은 사라짐) |
| `account status` | 로그인된 Microsoft 계정과 소유한 에디션 표시 |
| `account login` | Microsoft 계정에 로그인하거나 계정 전환 |
| `account logout` | 런처의 Microsoft 계정을 잊음 |
| `config list` | 런처 설정과 폴더 목록 |
| `config get <key>` | 설정 값 출력 |
| `config set <key> <value>` | 설정 변경 |
| `config unset <key>` | 설정을 기본값으로 되돌림 |
| `cache clean [packages\|downloads\|partial]...` | 캐시가 차지하는 디스크 공간 확보 |
| `doctor [--fix [<fix>...]]` | 이 PC에서 Minecraft와 모드에 필요한 것을 확인, `--fix`로 수리(`vcruntime`, `gameinput`, `loader-migration`, `developer-mode`) |
| `self-update` | LeviLauncher 자체를 최신 릴리스로 업데이트 |
| `version` | 버전 정보 출력 |
| `help [<command>...]` | 모든 명령의 도움말과 예제 |

모든 `list` 동사는 `ls`로도, 모든 `remove` 동사는 `rm`으로도 쓸 수 있습니다. `config`가 읽고 바꾸는 설정은 [모든 설정](./settings#command-line-keys)에 있습니다.

### 버전과 패키지

- `install`과 `installer`의 `<version>`은 `installer search`의 빌드입니다. 정확한 버전(`1.21.50.07`), 점으로 구분된 접두사(`1.21.50`은 최신 `1.21.50.x`이며, `1.21.5`는 이와 일치하지 않음) 또는 `latest`. `<file>`은 로컬 `.msixvc`, `.appx`, `.msix`, `.appxbundle`, `.msixbundle`입니다.
- `mod install`의 `<package>`는 `owner/repo`, `github.com/owner/repo` 또는 URL이며, `#variant`와 `@version`을 붙일 수 있습니다.

## 전역 플래그

다음 플래그는 모든 명령에서 쓸 수 있습니다.

| 플래그 | 의미 |
| --- | --- |
| `-i`, `--instance <name>` | 대상 인스턴스 |
| `-p`, `--player <id\|gamertag>` | 플레이어 프로필(GDK 인스턴스) |
| `--json` | stdout에 기계가 읽을 수 있는 출력 |
| `-q`, `--quiet` | 식별자만 출력, 진행 상황이나 알림 없음 |
| `-v`, `--verbose` | 더 자세한 정보와 stderr로 런처 로그 |
| `-y`, `--yes` | 확인에 예라고 답함 |
| `--no-input` | 절대 묻지 않음 |
| `-h`, `--help` | 명령 도움말 |
| `--version` | 버전 출력 |

**어떤 인스턴스:** `-i`, 없으면 환경 변수 `LEVILAUNCHER_INSTANCE`, 없으면 기본 인스턴스(`use`), 없으면 유일한 인스턴스. **어떤 플레이어:** `-p`, 없으면 `LEVILAUNCHER_PLAYER`, 없으면 유일한 프로필, 없으면 로그인된 계정의 프로필.

## 출력

- 결과는 stdout으로 갑니다. 진행 상황, 알림, 오류는 stderr로 가며, 오류는 `error:`로 출력되고 `hint:`와 `[ERR_GAME_RUNNING]` 같은 오류 코드가 붙습니다.
- `--json`은 JSON 문서 하나를 출력합니다. 목록은 배열, 그 외에는 객체이며, 키는 camelCase, 시간은 RFC 3339, 크기는 바이트 단위입니다.
- `-q`는 식별자만 한 줄에 하나씩 출력합니다.

## 종료 코드

| 코드 | 의미 |
| --- | --- |
| 0 | 성공 |
| 1 | 실패 |
| 2 | 사용법 오류 |
| 3 | 찾을 수 없음 |
| 4 | 충돌(예: 게임이 실행 중) |
| 5 | 로그인 또는 라이선스 |
| 6 | 네트워크 |
| 7 | 일부만 완료 |
| 8 | 시스템 변경 또는 관리자 권한 필요 |
| 9 | 시간 초과 |
| 10 | 취소됨 |
| 130 | 중단됨(Ctrl-C) |

`launch --wait-exit`는 대신 게임 자체의 종료 코드를 반환합니다.

## 창 인수

다음 인수는 명령을 실행하는 대신 창을 엽니다.

| 인수 | 효과 |
| --- | --- |
| `--launch=<instance>` | 런처를 열고 인스턴스를 시작합니다. 바탕 화면 바로 가기가 이것을 씁니다. 런처가 이미 실행 중이면 거기서 인스턴스를 시작합니다. |
| `--debug` | 런처 로그를 콘솔 창에도 표시합니다(`debug`, `-debug`, `/debug`도 동작). |
