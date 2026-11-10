import React, { useEffect } from 'react';
import { reducedMotion } from './magic';

/*
 * The welcome after the right family password, shown before the album opens.
 * - Every sign-in: "Vaanga, vaanga!" (come in, come in), as every Tamil home says at the door.
 * - The very first time on a phone: the front door of the family home swings open,
 *   over a kolam drawn on the doorstep, with the same welcome behind it.
 * A tap anywhere skips it. With "reduce motion" the door is already open and nothing moves.
 */

const DOOR_KEY = 'kmk-door-opened';

/** True only the first time this phone signs in; remembers the door was opened. */
export function firstTimeOnThisPhone(): boolean {
  try {
    if (localStorage.getItem(DOOR_KEY)) return false;
    localStorage.setItem(DOOR_KEY, '1');
    return true;
  } catch {
    return false; // private mode: just the short welcome
  }
}

export const WelcomeIn: React.FC<{ door: boolean; onEnd: () => void }> = ({ door, onEnd }) => {
  useEffect(() => {
    const still = reducedMotion();
    const ms = door ? (still ? 1600 : 3300) : (still ? 1100 : 1500);
    const t = window.setTimeout(onEnd, ms);
    return () => window.clearTimeout(t);
  }, [door, onEnd]);

  return (
    <div role="status" aria-live="polite" onClick={onEnd}
      className="welcome-in fixed inset-0 z-[100] flex flex-col items-center justify-center bg-album-paper text-album-leaf font-album px-4 cursor-pointer select-none">
      {door ? <FrontDoor /> : <Vaanga />}
      <span className="sr-only">Welcome to the K.M.Krishna samy pillai & Andal ammal family</span>
    </div>
  );
};

const Vaanga: React.FC<{ inDoor?: boolean }> = ({ inDoor = false }) => (
  <span className={`flex flex-col items-center text-center leading-tight ${inDoor ? 'vaanga-behind' : 'magic-pop'}`}>
    <span className={`font-hand font-bold text-album-terracotta ${inDoor ? 'text-[2.1rem]' : 'text-[3rem] sm:text-[3.6rem]'}`}>Vaanga, vaanga!</span>
    <span lang="ta" className={`font-extrabold ${inDoor ? 'text-xl' : 'text-[1.7rem]'}`}>வாங்க வாங்க!</span>
    <span className={`pt-1.5 ${inDoor ? 'text-[15px]' : 'text-lg'}`}>Welcome home to the K.M.Krishna samy pillai & Andal ammal family</span>
  </span>
);

/** A wooden double door in a teak frame, a kolam on the doorstep, warm light behind. */
const FrontDoor: React.FC = () => (
  <div className="flex flex-col items-center" aria-hidden="true">
    <div className="door-frame">
      <div className="door-inside">
        <Vaanga inDoor />
      </div>
      <div className="door-leaf door-left"><span className="door-knob" /></div>
      <div className="door-leaf door-right"><span className="door-knob" /></div>
    </div>
    <div className="door-step">
      <svg viewBox="0 0 220 56" className="w-full h-full">
        <g fill="#FFFDF6">
          {[30, 70, 110, 150, 190].map((x) => [16, 40].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" />))}
        </g>
        <path className="door-kolam" pathLength={1} fill="none" stroke="#FFFDF6" strokeWidth="2.4" strokeLinecap="round"
          d="M30 28 C30 6 70 6 70 28 C70 50 110 50 110 28 C110 6 150 6 150 28 C150 50 190 50 190 28 C190 6 150 6 150 28 C150 50 110 50 110 28 C110 6 70 6 70 28 C70 50 30 50 30 28 Z" />
      </svg>
    </div>
  </div>
);
