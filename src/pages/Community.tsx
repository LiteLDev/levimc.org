import { DiscordCard, GitHubCard, QQCard, TelegramCard } from '../components/CommunityCards';
import { PageHeader } from '../components/ui';
import { useDiscordInfo } from '../hooks/useExternalData';
import { useI18n } from '../i18n';

export default function Community() {
  const { t, locale } = useI18n();
  const discordInfo = useDiscordInfo();

  return (
    <div className="lm-page lm-container lm-container-narrow">
      <PageHeader eyebrow={t.nav.community.toUpperCase()} title={t.community.pageTitle} lead={t.community.pageDesc} />
      <div className="lm-grid-2">
        <DiscordCard info={discordInfo} />
        <TelegramCard />
        <GitHubCard />
        {/* QQ Card - Only show in Chinese */}
        {locale === 'zh' && <QQCard />}
      </div>
    </div>
  );
}
