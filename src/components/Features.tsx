import { PixelIcon, type PixelIconName } from '../../kit/components';
import { useI18n } from '../i18n';
import { Eyebrow } from './ui';

export default function Features({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const { t } = useI18n();
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const Sub = headingLevel === 1 ? 'h2' : 'h3';

  const features: { title: string; description: string; icon: PixelIconName }[] = [
    { title: t.features.platforms, description: t.features.platformsDesc, icon: 'monitor' },
    { title: t.features.oneCommand, description: t.features.oneCommandDesc, icon: 'chest' },
    { title: t.features.multiLang, description: t.features.multiLangDesc, icon: 'bookQuill' },
    { title: t.features.openSource, description: t.features.openSourceDesc, icon: 'emerald' },
  ];

  return (
    <section className="lm-section lm-container" id="features">
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
        {/* the same frameless item as the project grid: sprite, heading, one paragraph under a hairline */}
        {features.map((feature) => (
          <div key={feature.title} className="lm-feature">
            <PixelIcon name={feature.icon} size={32} className="lm-project-icon" />
            <Sub className="lm-project-name">{feature.title}</Sub>
            <p className="lm-project-desc">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
