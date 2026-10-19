import { PaintedHero, PixelButton } from '../../kit/components';
import { useLeviLaminaStats } from '../hooks/useExternalData';
import { useI18n } from '../i18n';
import CodeCard from './CodeCard';

export default function Hero() {
  const { t } = useI18n();
  const { version } = useLeviLaminaStats();
  // The trailing space keeps a word boundary between the two block-level title lines in textContent
  // ("Mod Bedrock your way."); at the end of a line it collapses, so nothing moves.
  const titleName = <>{t.hero.title1} </>;

  return (
    <PaintedHero
      className="lm-hero"
      name={titleName}
      text={t.hero.title2}
      tagline={
        <>
          {t.hero.description} <strong className="lm-hero-strong">{t.hero.descriptionHighlight}</strong>
          {t.hero.descriptionEnd} <span className="lm-hero-lang">C++</span>
          {t.hero.descriptionLanguages} <span className="lm-hero-lang">JavaScript</span>, <span className="lm-hero-lang">Lua</span>,{' '}
          <span className="lm-hero-lang">Python</span> {t.hero.descriptionLSE}
        </>
      }
      badge={
        <>
          <a href="https://github.com/LiteLDev/LeviLamina/releases/latest" target="_blank" rel="noopener" className="lm-release">
            <span className="lm-release-dot" aria-hidden="true" />
            <span>
              LeviLamina{' '}
              {version ? <span className="lm-release-version">{version}</span> : <span className="lm-skeleton lm-skeleton-sm lm-release-skeleton" />}{' '}
              {t.hero.badge}
            </span>
          </a>
        </>
      }
      aside={<CodeCard label={t.hero.languages} />}
    >
      <div className="kit-hero-actions">
        <PixelButton href="https://docs.levimc.org/LeviLamina/user_guides/install/" variant="primary" size="lg" iconRight="arrowRight">
          {t.hero.getStarted}
        </PixelButton>{' '}
        <PixelButton href="https://docs.levimc.org/LeviLamina/" size="lg">
          {t.hero.documentation}
        </PixelButton>
      </div>
    </PaintedHero>
  );
}
