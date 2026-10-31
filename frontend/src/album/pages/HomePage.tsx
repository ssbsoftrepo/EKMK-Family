import React, { useMemo } from 'react';
import { Family, birthdaysOn, firstName, placedIds, upcomingBirthdays, whoLine } from '../family';
import { href } from '../router';
import { Face, Hand, Icon, PersonTile, Print, Svg, Title } from '../ui';
import { useSiteSettings } from '../../lib/whatsapp';
import { ContactButtons } from '../../components/Common/ContactButtons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Welcome page for everyone: no names on top, a big family photo, then simple big buttons. */
export const HomePage: React.FC<{ family: Family }> = ({ family }) => {
  const settings = useSiteSettings();
  const founders = family.founders();
  const today = birthdaysOn(family.members);
  const soon = upcomingBirthdays(family.members, 31).filter((b) => b.inDays > 0).slice(0, 5);
  const placed = useMemo(() => placedIds(family.members), [family]);

  // Photos first, then everyone else; a stable pick so the page doesn't jump around.
  const faces = useMemo(() => {
    const onTree = family.members.filter((m) => placed.has(m.id));
    const pool = onTree.length ? onTree : family.members;
    return [...pool].sort((a, b) => Number(!!b.photoUrl) - Number(!!a.photoUrl) || (a.birthDate ?? '9999').localeCompare(b.birthDate ?? '9999')).slice(0, 8);
  }, [family, placed]);

  const photo = settings.homePhotoUrl || founders[0]?.couplePhotoUrl || '';
  const generations = Math.max(0, ...family.members.filter((m) => placed.has(m.id)).map((m) => m.generation || 0));
  const places = new Set(family.members.map((m) => (m.currentCity ?? '').split(',')[0].trim().toLowerCase()).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap gap-7 items-center">
        <div className="flex-[999_1_520px] min-w-0">
          <Print tilt={-1.2}>
            <div className="aspect-[16/10] rounded-md overflow-hidden relative flex items-end justify-center bg-album-peach">
              {photo ? (
                <img src={photo} alt="Our family" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <GroupSilhouette />
              )}
            </div>
            <figcaption className="pt-2.5 px-1 flex flex-col leading-tight">
              <span className="font-hand font-bold text-[26px]">Welcome to the KMK family!</span>
              <span lang="ta" className="text-base">கே.எம்.கே குடும்பத்திற்கு அன்புடன் வரவேற்கிறோம்</span>
            </figcaption>
          </Print>
        </div>
        <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-3">
          <Hand className="text-2xl">welcome home, everyone</Hand>
          <p className="m-0 text-xl leading-relaxed">Find any relative, see how you are related, and never miss a birthday.</p>
          {family.members.length > 0 && (
            <p className="m-0 text-lg">
              <strong>{family.members.length}</strong> of us{generations > 1 && <> · <strong>{generations}</strong> generations</>}{places > 1 && <> · from <strong>{places}</strong> places</>}
            </p>
          )}
        </div>
      </section>

      {today.length > 0 && (
        <section aria-label="Birthdays today" className="flex flex-col gap-3">
          {today.map((m) => (
            <div key={m.id} className="bg-white rounded-[22px] border-[3px] border-album-turmeric p-3 flex flex-wrap items-center gap-3">
              <a href={href.person(m.id)} className="no-underline text-album-leaf flex items-center gap-3 flex-[1_1_220px] min-w-0">
                <Face member={m} className="w-16 h-16" rounded="rounded-full" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xl font-extrabold">🎂 Today is {firstName(m)}'s birthday!</span>
                  <span lang="ta" className="text-[15px]">இன்று {firstName(m)} பிறந்தநாள்</span>
                </span>
              </a>
              <div className="flex-[0_1_240px] min-w-[200px]">
                <ContactButtons member={m} message="birthday" compact />
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3.5">
        <Title as="h2" en="What would you like to do?" ta="என்ன செய்ய விரும்புகிறீர்கள்?" />
        <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
          <Tile to={href.find()} en="Find a relative" ta="உறவினரைத் தேடு" icon={Icon.search} bg="#BFD8B0" />
          <Tile to={href.family()} en="Family tree" ta="குடும்ப மரம்" icon={Icon.tree} bg="#F6D77A" />
          <Tile to={href.related()} en="How are we related?" ta="நமக்குள் என்ன உறவு?" icon={Icon.link} bg="#F2C6B4" />
          <Tile to={href.home()} onClick={() => document.getElementById('birthdays')?.scrollIntoView({ behavior: 'smooth' })} en="Birthdays" ta="பிறந்தநாள்" icon={Icon.cake} bg="#E8A58C" />
        </div>
      </section>

      <section id="birthdays" aria-label="Coming birthdays" className="flex flex-col gap-3 scroll-mt-24">
        <Title as="h2" en="Coming birthdays" ta="வரும் பிறந்தநாட்கள்" />
        {soon.length === 0 ? (
          <span className="text-lg">No birthdays in the next month.</span>
        ) : (
          <div className="flex flex-col gap-2 max-w-[640px]">
            {soon.map(({ member, date, inDays }) => (
              <a key={member.id} href={href.person(member.id)} className="no-underline text-album-leaf bg-white rounded-[18px] p-2 pr-4 flex items-center gap-3 shadow-[0_3px_0_#DCE6D2]">
                <span className="w-[52px] h-[52px] rounded-[14px] bg-album-leaf text-white flex flex-col items-center justify-center leading-none flex-shrink-0">
                  <span className="text-xl font-extrabold">{date.getDate()}</span>
                  <span className="text-xs">{MONTHS[date.getMonth()].toUpperCase()}</span>
                </span>
                <span className="flex-1 min-w-0 text-lg font-extrabold truncate">{member.fullName}</span>
                <span className="text-[15px] flex-shrink-0">{inDays === 1 ? 'tomorrow' : `in ${inDays} days`}</span>
              </a>
            ))}
          </div>
        )}
        <Hand className="text-lg">only the day and month are shown, ages stay secret!</Hand>
      </section>

      {faces.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2.5">
            <Title as="h2" en="Some of our family" ta="நம் குடும்பத்தில் சிலர்" />
            <a href={href.find()} className="text-lg font-extrabold text-album-terracotta min-h-[44px] flex items-center">See everyone ›</a>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {faces.map((m) => <PersonTile key={m.id} member={m} href={href.person(m.id)} line={whoLine(family, m)} />)}
          </div>
        </section>
      )}
    </div>
  );
};

const Tile: React.FC<{ to: string; en: string; ta: string; icon: React.ReactNode; bg: string; onClick?: () => void }> = ({ to, en, ta, icon, bg, onClick }) => (
  <a href={to} onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined} className="no-underline text-album-leaf bg-white rounded-[22px] p-2 pb-3 flex flex-col gap-2 shadow-[0_4px_0_#1E4636] active:translate-y-[2px] active:shadow-[0_2px_0_#1E4636] transition">
    <span className="h-[84px] rounded-2xl flex items-center justify-center" style={{ background: bg }}>
      <Svg icon={icon} className="w-11 h-11" stroke={2} />
    </span>
    <span className="flex flex-col leading-tight px-1">
      <span className="text-lg font-extrabold">{en}</span>
      <span lang="ta" className="text-sm">{ta}</span>
    </span>
  </a>
);

const GroupSilhouette: React.FC = () => (
  <>
    <svg aria-hidden="true" viewBox="0 0 330 190" preserveAspectRatio="xMidYMax meet" className="w-[90%] h-[80%]">
      <g fill="#FFFFFF" fillOpacity="0.5">
        <circle cx="60" cy="78" r="24" /><path d="M20 190c4-50 20-78 40-78s36 28 40 78z" />
        <circle cx="125" cy="62" r="26" /><path d="M80 190c4-56 22-86 45-86s41 30 45 86z" />
        <circle cx="200" cy="62" r="26" /><path d="M155 190c4-56 22-86 45-86s41 30 45 86z" />
        <circle cx="268" cy="78" r="24" /><path d="M228 190c4-50 20-78 40-78s36 28 40 78z" />
        <circle cx="165" cy="128" r="17" /><path d="M138 190c3-30 13-46 27-46s24 16 27 46z" />
      </g>
    </svg>
    <span className="absolute left-3 top-3 bg-white/85 rounded-full px-3 py-0.5 text-sm font-semibold">The family photo goes here</span>
  </>
);
