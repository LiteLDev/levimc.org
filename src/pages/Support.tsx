import { PixelButton, PixelIcon } from '../../kit/components';
import { PageHeader } from '../components/ui';
import { DONORS } from '../data/donors';
import { useI18n } from '../i18n';

const DONATION_CHANNELS = [
  { id: 'afdian', href: 'https://afdian.com/a/liteldev' },
  { id: 'opencollective', href: 'https://opencollective.com/levimc' },
] as const;

export default function Support() {
  const { t } = useI18n();
  const donors = DONORS;
  const channelLabel = { afdian: t.support.channelAfdian, opencollective: t.support.channelOpenCollective };

  return (
    <div className="lm-page lm-container lm-container-mid">
      <PageHeader title={t.support.pageTitle} lead={t.support.pageDesc} />

      <div className="lm-grid-2 lm-support-ways">
        <section className="px-card lm-way">
          <span className="kit-slot lm-way-slot" aria-hidden="true">
            <PixelIcon name="pickaxe" size={32} />
          </span>
          <h2 className="lm-way-title">{t.support.contributeTitle}</h2>
          <p className="lm-way-desc">{t.support.contributeDesc}</p>
          <div className="lm-way-actions">
            <PixelButton href="https://github.com/LiteLDev/LeviLamina/issues" variant="primary">
              {t.support.contributeCta}
            </PixelButton>
            <PixelButton href="https://github.com/LiteLDev">GitHub</PixelButton>
          </div>
        </section>

        <section className="px-card lm-way">
          <span className="kit-slot lm-way-slot" aria-hidden="true">
            <PixelIcon name="emerald" size={32} />
          </span>
          <h2 className="lm-way-title">{t.support.donateTitle}</h2>
          <p className="lm-way-desc">{t.support.donateDesc}</p>
          <div className="lm-channels">
            <div className="lm-channels-label">{t.support.donateChannels}</div>
            <div className="lm-channels-list">
              {DONATION_CHANNELS.map((c) => (
                <a key={c.id} href={c.href} target="_blank" rel="noopener" className="px-card lm-channel">
                  <span>{channelLabel[c.id]}</span>
                  <PixelIcon name="arrowRight" />
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="lm-donors">
        <div className="lm-donors-head">
          <h2 className="lm-title lm-title-sm">{t.support.donorsSectionTitle}</h2>
          <p className="lm-lead lm-donors-desc">{t.support.donorsSectionDesc}</p>
        </div>

        {donors.length === 0 ? (
          <div className="px-card lm-donors-empty">
            <p className="lm-donors-empty-title">{t.support.donorsEmptyTitle}</p>
            <p>{t.support.donorsEmpty}</p>
          </div>
        ) : (
          <div className="lm-donor-grid">
            {donors.map((donor, index) => (
              <article key={`${donor.name}-${donor.date}-${index}`} className="lm-donor">
                <div className="lm-donor-head">
                  <h3 className="lm-donor-name">
                    {donor.link ? (
                      <a href={donor.link} target="_blank" rel="noopener" title={t.support.donorLinkLabel}>
                        {donor.name}
                      </a>
                    ) : (
                      donor.name
                    )}
                  </h3>
                  {donor.amount && <span className="lm-donor-amount">{donor.amount}</span>}
                </div>
                {donor.date && <p className="lm-donor-date">{donor.date}</p>}
                {donor.message && <p className="lm-donor-message">{donor.message}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
