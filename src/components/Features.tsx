import { PixelButton, PixelIcon, type PixelIconName } from '../../kit/components';
import { useI18n } from '../i18n';
import { Eyebrow } from './ui';

export default function Features({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const { t } = useI18n();
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const Sub = headingLevel === 1 ? 'h2' : 'h3';

  const features: { title: string; description: string; icon: PixelIconName }[] = [
    { title: t.features.nativeCpp, description: t.features.nativeCppDesc, icon: 'diamond' },
    { title: t.features.multiLang, description: t.features.multiLangDesc, icon: 'bookQuill' },
    { title: t.features.openSource, description: t.features.openSourceDesc, icon: 'chest' },
    { title: t.features.community, description: t.features.communityDesc, icon: 'emerald' },
  ];

  return (
    <section className="lm-section lm-container">
      <div className="lm-split-head">
        <div>
          <Eyebrow>{t.features.label}</Eyebrow>
          <Heading className="lm-title">
            {t.features.title1}
            <br />
            <span className="lm-gradient-text">{t.features.title2}</span>
          </Heading>
        </div>
        <p className="lm-lead lm-split-lead">{t.features.description}</p>
      </div>

      <div className="lm-grid-4">
        {/* kit Card styling, with a real heading per feature (as before) */}
        {features.map((feature) => (
          <div key={feature.title} className="px-card kit-card lm-feature">
            <span className="kit-card-icon kit-slot" aria-hidden="true">
              <PixelIcon name={feature.icon} size={32} />
            </span>
            <div className="kit-card-body">
              <Sub className="kit-card-title">{feature.title}</Sub>
              <p className="kit-card-desc">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-card kit-painted lm-cta">
        <div className="lm-cta-copy">
          <Sub className="lm-cta-title">{t.features.cta}</Sub>
          <p className="lm-cta-desc">{t.features.ctaDesc}</p>
        </div>
        <PixelButton href="https://docs.levimc.org/LeviLamina/" variant="primary" size="lg" iconRight="external">
          {t.features.readDocs}
        </PixelButton>
      </div>
    </section>
  );
}
