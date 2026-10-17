import { PaintedHero, PixelButton } from '../../kit/components';
import { formatStarCount } from '../services/githubService';
import { useLeviLaminaStats } from '../hooks/useExternalData';
import { useI18n } from '../i18n';
import CodeCard from './CodeCard';
import logoUrl from '../icons/logo.svg';

export default function Hero() {
  const { t } = useI18n();
  const { version, stats } = useLeviLaminaStats();

  return (
    <PaintedHero
      className="lm-hero"
      name={t.hero.title1}
      text={t.hero.title2}
      tagline={
        <>
          {t.hero.description} <strong className="lm-hero-strong">{t.hero.descriptionHighlight}</strong>
          {t.hero.descriptionEnd} <span className="lm-hero-lang">C++</span>
          {t.hero.descriptionLanguages} <span className="lm-hero-lang">JavaScript</span>, <span className="lm-hero-lang">Lua</span>,{' '}
          <span className="lm-hero-lang">Python</span> {t.hero.descriptionLSE}
        </>
      }
    >
      {/* first in the column (CSS order): logo in an item frame + the live release badge */}
      <div className="kit-hero-badge lm-hero-top">
        <span className="kit-item-frame kit-hero-icon lm-hero-logo">
          <img src={logoUrl} alt="LeviMC logo" width={44} height={44} />
        </span>
        <a href="https://github.com/LiteLDev/LeviLamina/releases/latest" target="_blank" rel="noopener" className="lm-release">
          <span className="lm-release-dot" aria-hidden="true" />
          <span>
            LeviLamina{' '}
            {version ? <span className="lm-release-version">{version}</span> : <span className="lm-skeleton lm-skeleton-sm lm-release-skeleton" />}{' '}
            {t.hero.badge}
          </span>
        </a>
      </div>

      <div className="kit-hero-actions">
        <PixelButton href="https://docs.levimc.org/LeviLamina/user_guides/install/" variant="primary" size="lg" iconRight="arrowRight">
          {t.hero.getStarted}
        </PixelButton>{' '}
        <PixelButton href="https://docs.levimc.org/LeviLamina/" size="lg" icon="bookQuill">
          {t.hero.documentation}
        </PixelButton>
      </div>

      <div className="lm-stats">
        <div className="lm-stat">
          {stats ? <div className="lm-stat-value">{formatStarCount(stats.stars)}</div> : <div className="lm-skeleton lm-stat-skeleton" />}
          <div className="lm-stat-label">{t.hero.stars}</div>
        </div>
        <div className="lm-stat">
          {stats ? <div className="lm-stat-value">{stats.forks}+</div> : <div className="lm-skeleton lm-stat-skeleton" />}
          <div className="lm-stat-label">{t.hero.forks}</div>
        </div>
        <div className="lm-stat">
          <div className="lm-stat-value">4</div>
          <div className="lm-stat-label">{t.hero.languages}</div>
        </div>
      </div>

      <CodeCard label={t.hero.languages} />
    </PaintedHero>
  );
}
