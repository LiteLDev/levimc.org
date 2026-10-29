import { PaintedHero } from '../../kit/components';
import { useI18n } from '../i18n';
import { RoleShowcase, RoleTabs, useRole } from './Roles';

/** The home hero: what LeviMC is, then "I want to…" tabs for players, server owners and developers. */
export default function Hero() {
  const { t } = useI18n();
  const [role, setRole] = useRole();
  // The trailing space keeps a word boundary between the two block-level title lines in textContent
  // ("Mod Bedrock your way."); at the end of a line it collapses, so nothing moves.
  const titleName = <>{t.hero.title1} </>;

  return (
    <PaintedHero
      className="lm-hero"
      eyebrow={t.hero.eyebrow}
      name={titleName}
      text={t.hero.title2}
      tagline={t.hero.tagline}
      aside={<RoleShowcase role={role} />}
    >
      <RoleTabs role={role} onChange={setRole} />
    </PaintedHero>
  );
}
