# LeviLauncher

Windows 및 Android용 Minecraft Bedrock 런처: Windows PC나 Android 기기에서 Minecraft Bedrock Edition을 설치, 관리, 격리, 모드 적용 및 실행하세요.

**다운로드:** [Windows용 LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases/latest) · [Android용 LeviLauncher](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) · [다운로드](./download) 페이지에서 각 버전에 필요한 것과 다른 다운로드 경로를 확인할 수 있습니다.

::: info Windows 및 Android
LeviLauncher에는 Minecraft Bedrock Edition(GDK / UWP)용 **Windows 버전**과 Google Play 공식 Minecraft용 **Android 버전**이 있습니다. 두 버전 모두 **정품 라이선스**가 필요합니다. iOS 버전은 없으며, 계획도 없습니다.
:::

::: tip 여기서 시작하세요
LeviLauncher가 처음이라면 튜토리얼 [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/)(영어)이 LeviLauncher 다운로드부터 모드를 넣은 첫 플레이까지 안내합니다.
:::

## LeviLauncher가 하는 일

- **버전 중심.** Minecraft 정식판과 프리뷰 판을 설치, 이름 변경, 실행, 삭제하면서 각 환경을 체계적으로 관리합니다. 설치된 각 사본은 *인스턴스*입니다. [버전 관리](./guide/version-management)와 [인스턴스와 게임 버전](./concepts/instances)을 참조하세요.
- **깨끗한 격리.** 더 안전한 작업 공간이 필요할 때 월드, 팩 및 게임 파일을 기본 AppData 설치와 분리하여 보관합니다. [인스턴스 격리](./concepts/isolation)를 참조하세요.
- **콘텐츠 관리.** 한곳에서 월드, 리소스 팩, 행동 팩, 스킨 팩, 스크린샷 및 서버 목록을 관리합니다. [콘텐츠 관리](./guide/content-management)를 참조하세요.
- **모드 기능.** `.mcmod` 모드 패키지를 가져오고, CurseForge를 탐색하며, 내장 패키지 관리자로 LeviLamina와 LIP 패키지를 설치할 수 있습니다. [모드 및 통합](./guide/mods-integrations)과 [모드 로드 방식](./concepts/mod-loading)을 참조하세요.
- **월드 도구.** 런처를 벗어나지 않고 백업을 내보내고, 월드 데이터를 확인하며, 일부 `level.dat` 필드를 편집할 수 있습니다. [월드 도구](./guide/world-tools)를 참조하세요.
- **사용자 설정.** 언어, 외관, 다운로드 동작, 개인정보 보호 설정, 업데이트 채널 및 패키지 관리를 조정합니다. [설정 및 개인화](./guide/settings-personalization)와 [모든 설정](./reference/settings)을 참조하세요.
- **Android 전용 기능.** 같은 런처에서 Xbox 계정 전환과 URI 빠른 실행. [계정 및 빠른 실행](./guide/accounts-quick-launch)을 참조하세요.

## 간단한 예

Windows에서는 런처 창에서 하는 모든 일을 터미널에서도 할 수 있습니다. 다음 세 명령은 최신 Minecraft 정식판 빌드를 LeviLamina와 함께 새 인스턴스로 설치하고 기본 인스턴스로 지정한 다음, [LeviMC Mods](https://levimc.org/mods/)의 모드 하나를 추가하고 게임을 실행합니다.

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe play
```

GDK 빌드를 설치하려면 Minecraft를 소유한 Microsoft 계정으로 로그인해야 합니다(`LeviLauncher.exe account login`). 창에서는 같은 단계가 **다운로드** 페이지, **LeviMC Mods** 페이지, **실행** 버튼에 해당합니다. [명령줄](./reference/command-line) 참조에 모든 명령이 나와 있습니다.

## 이 사이트는 무엇을 포함하나요?

이 문서는 **최종 사용자**를 대상으로 하며, 유지 관리자나 개발자를 대상으로 하지 않습니다.

- **가이드**: 한 페이지에 한 가지 작업. [다운로드](./download) 페이지에서 앱을 받은 다음 [버전](./guide/version-management), [다운로드와 미러](./guide/downloads-mirrors), [콘텐츠](./guide/content-management), [계정과 빠른 실행](./guide/accounts-quick-launch)(Android), [모드](./guide/mods-integrations), [월드](./guide/world-tools), [설정](./guide/settings-personalization)을 관리하세요. 도움말 그룹에서는 [업데이트 및 문제 해결](./guide/update-troubleshooting)과 [커뮤니티 및 피드백](./guide/faq-community-feedback)을 다룹니다.
- **개념**: LeviLauncher가 동작하는 방식. [인스턴스와 게임 버전](./concepts/instances)(정식판과 프리뷰, GDK와 UWP, Windows와 Android), [인스턴스 격리](./concepts/isolation), [모드 로드 방식](./concepts/mod-loading).
- **참조**: [명령줄](./reference/command-line), [모든 설정](./reference/settings), LeviLauncher가 사용하는 [폴더 및 파일](./reference/files), Android의 [빠른 실행 URI](./reference/quick-launch-uri), Android 버전의 [개인정보 처리방침](./privacy-policy).

권장 읽기 순서: 튜토리얼 [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/), 그다음 [버전 관리](./guide/version-management)와 [콘텐츠 관리](./guide/content-management).

## 다운로드 채널

- **GitHub 릴리스(LeviLauncher 다운로드):** [LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- **란조우(Lanzou) 클라우드 미러:** [levimc.lanzoue.com/b016ke39hc](https://levimc.lanzoue.com/b016ke39hc) — 비밀번호: `levi`
- **Android 버전:** [LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

## 커뮤니티 및 피드백

- **공식 디스코드(Discord):** [discord.gg/v5R5P4vRZk](https://discord.gg/v5R5P4vRZk)
- **개인 디스코드 채널:** [discord.gg/VqQaC8vWz8](https://discord.gg/VqQaC8vWz8)
- **QQ 그룹:** [458083875](https://qm.qq.com/q/1z791rJgJG)
- **문제 피드백:** [GitHub Issues](https://github.com/LiteLDev/LeviLauncher/issues)
