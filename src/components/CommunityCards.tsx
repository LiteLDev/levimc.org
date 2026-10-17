import type { ReactNode } from 'react';
import { BrandIcon, LINKS, PixelIcon, SOCIAL, type BrandIconName } from '../../kit/components';
import type { DiscordInfo } from '../services/githubService';
import { useI18n } from '../i18n';

// Canonical, redirect-free URLs from the kit's cross-site registry.
const socialUrl = (id: 'discord' | 'telegram') => SOCIAL.find((s) => s.id === id)!.url;
export const DISCORD_URL = socialUrl('discord');
export const TELEGRAM_URL = socialUrl('telegram');
export const GITHUB_URL = LINKS.github;

const QQ_GROUPS = [
  {
    id: '656669024',
    url: 'https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=ndxRXO1HARA8ing7OunMClOz3cQTogL0&authKey=D7QTcqnzhBzuh3zc%2F70FjgklsVvkCImTjSRqHMwYGCLwIFpxzp%2FflC97Y7AUG%2Fpy&noverify=0&group_code=656669024',
  },
  {
    id: '937236109',
    url: 'https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=1u0nmmUIZOB716neFTlbyj_2aOQn_TV-&authKey=1lBqM20oOfdKjDnxkq09DjR729fqFfWVnaLQ7VjrDB%2FAg6qwvw6QCwdwYoRUrewU&noverify=0&group_code=937236109',
  },
  {
    id: '850517473',
    url: 'https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=3Fxt0gwMYkoLPani_vQ9tsNfYrnVy4hK&authKey=2A%2BNk3jmRaK%2FO1FBQSjTIbStAU1kbZWkjEkyh2RTVA015eTg6c4CvVhfByc1BtGZ&noverify=0&group_code=850517473',
  },
];

type Accent = 'discord' | 'telegram' | 'github' | 'qq';

function QQGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29 0 2.213.43 6.29.686 6.29 0 0-.687-1.77-1.182-1.77-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.747 2.072.111 0 .281-.36.281-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z" />
    </svg>
  );
}

function CardHead({ accent, glyph, title, sub }: { accent: Accent; glyph: ReactNode; title: string; sub?: ReactNode }) {
  return (
    <div className="lm-community-head">
      <span className={`kit-slot lm-brand-slot lm-accent-${accent}`} aria-hidden="true">
        {glyph}
      </span>
      <div className="lm-community-heading">
        <h3 className="lm-community-title">{title}</h3>
        {sub ? <div className="lm-community-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

function LinkCard({ href, accent, icon, title, sub, desc, cta }: { href: string; accent: Accent; icon: BrandIconName; title: string; sub?: ReactNode; desc: string; cta: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={`px-card lm-community-card lm-accent-${accent}`}>
      <CardHead accent={accent} glyph={<BrandIcon name={icon} size={22} />} title={title} sub={sub} />
      <p className="lm-community-desc">{desc}</p>
      <span className="lm-community-cta">
        {cta}
        <PixelIcon name="arrowRight" />
      </span>
    </a>
  );
}

/** Live Discord presence ("● 1029 online"); empty until the widget data has loaded. */
function DiscordPresence({ info }: { info?: DiscordInfo }) {
  const { t } = useI18n();
  if (!info) return <span className="lm-skeleton lm-skeleton-sm" />;
  return (
    <span className="lm-online">
      <span className="lm-online-dot" aria-hidden="true" />
      {info.onlineCount} {t.community.online}
    </span>
  );
}

export function DiscordCard({ info }: { info?: DiscordInfo }) {
  const { t } = useI18n();
  return (
    <LinkCard
      href={DISCORD_URL}
      accent="discord"
      icon="discord"
      title="Discord"
      sub={<DiscordPresence info={info} />}
      desc={t.community.discordDesc}
      cta={t.community.joinDiscord}
    />
  );
}

export function TelegramCard() {
  const { t } = useI18n();
  return (
    <LinkCard
      href={TELEGRAM_URL}
      accent="telegram"
      icon="telegram"
      title="Telegram"
      sub={t.community.telegramLabel}
      desc={t.community.telegramDesc}
      cta={t.community.joinTelegram}
    />
  );
}

export function GitHubCard() {
  const { t } = useI18n();
  return <LinkCard href={GITHUB_URL} accent="github" icon="github" title="GitHub" sub="LiteLDev" desc={t.community.githubDesc} cta={t.community.viewOnGitHub} />;
}

/** QQ groups (shown to Chinese readers only). One colour everywhere: redstone. */
export function QQCard() {
  const { t } = useI18n();
  return (
    <div className="px-card lm-community-card lm-accent-qq">
      <CardHead accent="qq" glyph={<QQGlyph />} title={t.community.qqTitle} sub={t.community.qqGroups} />
      <p className="lm-community-desc">{t.community.qqDesc}</p>
      <div className="lm-qq-groups">
        {QQ_GROUPS.map((g) => (
          <a key={g.id} href={g.url} target="_blank" rel="noopener" className="mc-btn mc-btn-sm lm-qq-group">
            {g.id}
          </a>
        ))}
      </div>
    </div>
  );
}
