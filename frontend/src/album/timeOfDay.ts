import { useEffect, useState } from 'react';

/** A Tamil greeting that follows the clock on the visitor's phone. */
export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export const GREETINGS: Record<DayPart, { en: string; ta: string; note: string }> = {
  morning: { en: 'Kaalai vanakkam!', ta: 'காலை வணக்கம்', note: 'have your filter coffee and meet the family' },
  afternoon: { en: 'Madhiya vanakkam!', ta: 'மதிய வணக்கம்', note: 'a good time for a quick look around' },
  evening: { en: 'Maalai vanakkam!', ta: 'மாலை வணக்கம்', note: 'evening tea time, see who’s here' },
  night: { en: 'Iniya iravu!', ta: 'இனிய இரவு', note: 'the stars are out, so is the whole family' },
};

export function dayPart(date = new Date()): DayPart {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 16) return 'afternoon';
  if (h >= 16 && h < 19) return 'evening';
  return 'night';
}

/** The current part of the day, checked again every few minutes. */
export function useDayPart(): DayPart {
  const [part, setPart] = useState(() => dayPart());
  useEffect(() => {
    const t = setInterval(() => setPart(dayPart()), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return part;
}
