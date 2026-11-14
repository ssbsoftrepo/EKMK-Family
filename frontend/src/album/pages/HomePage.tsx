import React, { useMemo } from 'react';
import { Family, birthdaysOn, firstName, placedIds, upcomingBirthdays, whoLine } from '../family';
import { href } from '../router';
import { Face, Hand, Icon, PersonTile, Print, Svg, Title } from '../ui';
import { useSiteSettings } from '../../lib/siteSettings';
import { ContactButtons } from '../../components/Common/ContactButtons';
import { useBirthdayPetals } from '../Magic';
import { GREETINGS, useDayPart } from '../timeOfDay';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Welcome page for everyone: no names on top, a big family photo, then simple big buttons. */
export const HomePage: React.FC<{ family: Family }> = ({ family }) => {
  const settings = useSiteSettings();
  const greeting = GREETINGS[useDayPart()];
  const founders = family.founders();
  const today = birthdaysOn(family.members);
  const soon = upcomingBirthdays(family.members, 31).filter((b) => b.inDays > 0).slice(0, 5);
  const placed = useMemo(() => placedIds(family.members), [family]);
  useBirthdayPetals(today.length > 0, `home-${new Date().toDateString()}`);

  // 1st generation children (children of the founders/elders)
  const firstGenChildren = useMemo(() => {
    const list = family.firstGenChildren();
    if (list.length > 0) return list;
    // Fallback if relations are still being linked
    const nonFounders = family.members.filter((m) => m.generation !== 1);
    return nonFounders.length > 0 ? nonFounders : family.members;
  }, [family]);

  // The home body hero image always displays the first generation couple photo as requested
  const photo = founders.find((f) => f.couplePhotoUrl)?.couplePhotoUrl || '';
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
              <span className="font-hand font-bold text-[20px] sm:text-[22px]">Welcome to the K.M.Krishna samy pillai & Andal ammal family!</span>
              <span lang="ta" className="text-sm sm:text-[15px] pt-0.5">கே.எம்.கிருஷ்ணசாமி பிள்ளை & ஆண்டாள் அம்மாள் குடும்பத்திற்கு அன்புடன் வரவேற்கிறோம்</span>
            </figcaption>
          </Print>
        </div>
        <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-3 text-center md:text-left items-center md:items-start">
          <div className="flex flex-col leading-tight items-center md:items-start">
            <Hand className="text-[1.7rem]">{greeting.en}</Hand>
            <span lang="ta" className="text-lg font-bold">{greeting.ta}</span>
          </div>
          <p className="m-0 text-xl leading-relaxed">
            Find any relative<br />
            See how you are related &amp;<br />
            Never miss a birthday
          </p>
          {family.members.length > 0 && (
            <p className="m-0 text-lg">
              <strong>{family.members.length}</strong> of us{generations > 1 && <> · <strong>{generations}</strong> generations</>}
              {places > 0 && (
                <>
                  <br />
                  from <strong>{places}</strong> {places === 1 ? 'place' : 'places'} across global
                </>
              )}
            </p>
          )}
        </div>
      </section>

      {firstGenChildren.length > 0 && (
        <section className="flex flex-col items-center gap-4 w-full">
          <div className="text-center flex flex-col items-center">
            <Title as="h2" en="Children of the Elders" ta="பெரியவர்களின் பிள்ளைகள்" />
          </div>
          <div className="flex flex-wrap justify-center items-stretch gap-2.5 sm:gap-4 md:gap-6 w-full max-w-[1000px] mx-auto">
            {firstGenChildren.map((m) => (
              <div key={m.id} className="w-[calc(50%-5px)] sm:w-[155px] md:w-[165px] flex">
                <PersonTile member={m} href={href.person(m.id)} line={whoLine(family, m)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {today.length > 0 && (
        <section aria-label="Birthdays today" className="flex flex-col gap-3">
          {today.map((m) => (
            <div key={m.id} className="bg-white rounded-[22px] border-[3px] border-album-turmeric p-3 flex flex-wrap items-center gap-3">
              <a href={href.person(m.id)} className="no-underline text-album-leaf flex items-center gap-3 flex-[1_1_220px] min-w-0">
                <Face member={m} className="w-16 h-16" rounded="rounded-full" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xl font-extrabold">🎂 Today is {m.fullName}'s birthday!</span>
                  <span lang="ta" className="text-[15px]">இன்று {m.fullName} பிறந்தநாள்</span>
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
        <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-3">
          <Tile to={href.find()} en="Find a relative" ta="உறவினரைத் தேடு" icon={Icon.search} bg="rgb(var(--c-sage))" />
          <Tile to={href.related()} en="How are we related?" ta="நமக்குள் என்ன உறவு?" icon={Icon.link} bg="rgb(var(--c-blush))" />
          <Tile to={href.home()} onClick={() => document.getElementById('birthdays')?.scrollIntoView({ behavior: 'smooth' })} en="Birthdays" ta="பிறந்தநாள்" icon={Icon.cake} bg="rgb(var(--c-peach))" />
        </div>
      </section>

      <section id="birthdays" aria-label="Coming birthdays" className="flex flex-col gap-3 scroll-mt-24">
        <Title as="h2" en="Up Coming birthdays" ta="வரும் பிறந்தநாட்கள்" />
        {soon.length === 0 ? (
          <span className="text-lg">No birthdays in the next month.</span>
        ) : (
          <div className="flex flex-col gap-2 max-w-[640px]">
            {soon.map(({ member, date, inDays }) => (
              <a key={member.id} href={href.person(member.id)} className="no-underline text-album-leaf bg-white rounded-[18px] p-2 pr-4 flex items-center gap-3 shadow-soft">
                <span className="w-[52px] h-[52px] rounded-[14px] bg-album-leaf text-white flex flex-col items-center justify-center leading-none flex-shrink-0">
                  <span className="text-xl font-extrabold">{date.getDate()}</span>
                  <span className="text-xs">{MONTHS[date.getMonth()].toUpperCase()}</span>
                </span>
                <span className="flex-1 min-w-0 flex flex-col leading-tight">
                  <span className="text-lg font-extrabold truncate">{member.fullName}</span>
                </span>
                <span className="text-[15px] flex-shrink-0">{inDays === 1 ? 'tomorrow' : `in ${inDays} days`}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Tile: React.FC<{ to: string; en: string; ta: string; icon: React.ReactNode; bg: string; onClick?: () => void }> = ({ to, en, ta, icon, bg, onClick }) => (
  <a href={to} onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined} className="no-underline text-album-leaf bg-white rounded-[22px] p-2 pb-3 flex flex-col gap-2 shadow-pop active:translate-y-[2px] active:shadow-pop-pressed transition">
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
