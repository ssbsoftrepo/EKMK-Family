import React, { useMemo } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { PersonAvatar } from '../Common/PersonAvatar';
import { ContactButtons } from '../Common/ContactButtons';

/** Today's birthdays with a one-tap WhatsApp wish. Only day and month are used: ages stay private. */
export const BirthdaysToday: React.FC = () => {
  const { members, setSelectedMember } = useFamily();
  const today = useMemo(() => {
    const now = new Date();
    const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return members.filter((m) => !m.isDeceased && m.birthDate && m.birthDate.slice(5, 10) === mmdd);
  }, [members]);

  if (today.length === 0) return null;

  return (
    <section aria-label="Birthdays today" className="py-8 bg-[#F3F7EC] border-b border-heritage-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-[#1E4636]">Birthday today!</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {today.map((m) => (
            <div key={m.id} className="bg-white rounded-3xl p-4 flex flex-col gap-3 border-2 border-[#F2B705]">
              <button type="button" onClick={() => setSelectedMember(m)} className="flex items-center gap-3 text-left">
                <span className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <PersonAvatar photoUrl={m.photoUrl} name={m.fullName} gender={m.gender} className="w-full h-full" />
                </span>
                <span className="text-lg font-bold text-[#1E4636]">Today is {m.firstName || m.fullName}'s birthday</span>
              </button>
              <ContactButtons member={m} message="birthday" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
