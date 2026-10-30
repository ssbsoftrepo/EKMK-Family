import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  X, 
  Sparkles,
} from 'lucide-react';

export interface HeritageDateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  max?: string;
  min?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DECADE_PRESETS = [1900, 1920, 1940, 1960, 1980, 2000, 2020];

/** Portal-based popover – escapes any parent overflow:hidden */
const CalendarPortal: React.FC<{
  triggerRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ triggerRef, children, onClose }) => {
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });

  useEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const calH = 370; // approx calendar height
    const openUp = spaceBelow < calH && rect.top > calH;
    setPos({
      top: openUp ? rect.top + window.scrollY - calH - 4 : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      openUp,
    });
  }, [triggerRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Close if click is outside the trigger and outside the portal
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('heritage-date-portal');
        if (portal && !portal.contains(e.target as Node)) onClose();
      }
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [triggerRef, onClose]);

  return createPortal(
    <div
      id="heritage-date-portal"
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 99999 }}
    >
      {children}
    </div>,
    document.body
  );
};

export const HeritageDateInput: React.FC<HeritageDateInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'DD-MM-YYYY',
  required = false,
  disabled = false,
  className = '',
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const triggerRef = useRef<HTMLDivElement>(null);

  const parsedValue = useMemo(() => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return { year: y, month: m, day: d };
    }
    return null;
  }, [value]);

  const today = useMemo(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth(), day: n.getDate() };
  }, []);

  const [viewYear, setViewYear] = useState(parsedValue?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(parsedValue?.month ?? today.month);
  const [yearGridStart, setYearGridStart] = useState(Math.floor((parsedValue?.year ?? today.year) / 12) * 12);

  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
      setYearGridStart(Math.floor(parsedValue.year / 12) * 12);
    }
  }, [parsedValue]);

  const formattedDisplay = useMemo(() => {
    if (!parsedValue) return '';
    const { year, month, day } = parsedValue;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(day)}-${pad(month + 1)}-${year}`;
  }, [parsedValue]);

  const daysInMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);
  const firstDayOfWeek = useMemo(() => new Date(viewYear, viewMonth, 1).getDay(), [viewYear, viewMonth]);
  const prevMonthDays = useMemo(() => new Date(viewYear, viewMonth, 0).getDate(), [viewYear, viewMonth]);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const selectDay = (day: number) => {
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`);
    setIsOpen(false); setViewMode('days');
  };
  const selectToday = () => {
    onChange(`${today.year}-${pad(today.month + 1)}-${pad(today.day)}`);
    setViewYear(today.year); setViewMonth(today.month);
    setIsOpen(false); setViewMode('days');
  };
  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(''); };
  const close = useCallback(() => { setIsOpen(false); setViewMode('days'); }, []);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1);
  };
  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1);
  };
  const prevYear = (e: React.MouseEvent) => { e.stopPropagation(); setViewYear(y => y - 1); };
  const nextYear = (e: React.MouseEvent) => { e.stopPropagation(); setViewYear(y => y + 1); };

  const calendarWidth = 310;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      {/* Trigger */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => { if (!disabled) setIsOpen(p => !p); }}
        onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setIsOpen(p => !p); } }}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs bg-[#FFFEFB] border rounded-xl transition-all select-none cursor-pointer ${
          isOpen ? 'border-heritage-maroon ring-2 ring-heritage-maroon/15' : 'border-heritage-border hover:border-heritage-gold'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate mr-1">
          <CalendarIcon className="w-3.5 h-3.5 text-heritage-gold-600 flex-shrink-0" />
          {formattedDisplay
            ? <span className="font-semibold text-heritage-charcoal truncate">{formattedDisplay}</span>
            : <span className="text-heritage-muted truncate">{placeholder}</span>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <button type="button" onClick={clear} className="p-0.5 rounded text-heritage-muted hover:text-rose-600 transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
          <div className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-heritage-gold' : 'bg-heritage-border'}`} />
        </div>
      </div>

      {helperText && <p className="text-[11px] text-heritage-muted mt-1">{helperText}</p>}

      {/* Calendar rendered via portal — escapes overflow:hidden */}
      {isOpen && (
        <CalendarPortal triggerRef={triggerRef} onClose={close}>
          <div
            style={{ width: calendarWidth }}
            className="bg-[#FFFEFB] border-2 border-heritage-gold/50 rounded-2xl shadow-2xl p-3.5 animate-fadeIn"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-heritage-border/60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-heritage-maroon flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-heritage-gold-600" />Heritage Calendar
              </span>
              <button type="button" onClick={close} className="p-0.5 rounded hover:bg-heritage-cream text-heritage-muted hover:text-rose-600 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── DAYS VIEW ── */}
            {viewMode === 'days' && (
              <div>
                {/* Month/Year nav */}
                <div className="flex items-center justify-between mb-2.5 bg-heritage-ivory/80 px-1.5 py-1 rounded-xl border border-heritage-border/60">
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={prevYear} className="p-1 rounded hover:bg-heritage-cream text-heritage-muted hover:text-heritage-maroon transition-colors">
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-heritage-cream text-heritage-charcoal hover:text-heritage-maroon transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 font-serif text-sm font-bold text-heritage-charcoal">
                    <button type="button" onClick={() => setViewMode('months')} className="px-2 py-0.5 rounded hover:bg-heritage-gold/20 hover:text-heritage-maroon transition-colors">
                      {MONTH_NAMES[viewMonth].slice(0, 3)}
                    </button>
                    <span className="text-heritage-gold-600 font-sans">•</span>
                    <button type="button" onClick={() => { setYearGridStart(Math.floor(viewYear / 12) * 12); setViewMode('years'); }} className="px-2 py-0.5 rounded hover:bg-heritage-gold/20 hover:text-heritage-maroon transition-colors">
                      {viewYear}
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-heritage-cream text-heritage-charcoal hover:text-heritage-maroon transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={nextYear} className="p-1 rounded hover:bg-heritage-cream text-heritage-muted hover:text-heritage-maroon transition-colors">
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Weekday header */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS_OF_WEEK.map((d, idx) => (
                    <span key={d} className={`text-center text-[11px] font-bold uppercase py-1 ${idx === 0 || idx === 6 ? 'text-heritage-maroon' : 'text-heritage-muted'}`}>
                      {d}
                    </span>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`p${i}`} className="h-8 flex items-center justify-center text-xs text-heritage-muted/25 select-none">
                      {prevMonthDays - firstDayOfWeek + 1 + i}
                    </div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSel = parsedValue?.year === viewYear && parsedValue?.month === viewMonth && parsedValue?.day === dayNum;
                    const isToday = today.year === viewYear && today.month === viewMonth && today.day === dayNum;
                    return (
                      <button key={dayNum} type="button" onClick={() => selectDay(dayNum)}
                        className={`h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                          isSel ? 'bg-heritage-maroon text-[#FAF7EE] font-bold ring-1 ring-heritage-gold/50'
                          : isToday ? 'border border-heritage-gold/70 text-heritage-maroon bg-heritage-gold-50/60 font-semibold'
                          : 'text-heritage-charcoal hover:bg-heritage-cream/80 hover:text-heritage-maroon'
                        }`}>
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── MONTHS VIEW ── */}
            {viewMode === 'months' && (
              <div>
                <div className="flex items-center justify-between mb-2.5 bg-heritage-ivory/80 px-1.5 py-1 rounded-xl border border-heritage-border/60">
                  <button type="button" onClick={prevYear} className="p-1 rounded hover:bg-heritage-cream"><ChevronLeft className="w-4 h-4 text-heritage-charcoal" /></button>
                  <button type="button" onClick={() => { setYearGridStart(Math.floor(viewYear / 12) * 12); setViewMode('years'); }} className="font-serif text-sm font-bold text-heritage-maroon hover:underline">
                    {viewYear}
                  </button>
                  <button type="button" onClick={nextYear} className="p-1 rounded hover:bg-heritage-cream"><ChevronRight className="w-4 h-4 text-heritage-charcoal" /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((name, idx) => (
                    <button key={name} type="button" onClick={() => { setViewMonth(idx); setViewMode('days'); }}
                      className={`py-2 text-xs rounded-xl font-medium transition-all ${
                        viewMonth === idx ? 'bg-heritage-maroon text-[#FAF7EE] font-bold' : 'bg-heritage-ivory text-heritage-charcoal hover:bg-heritage-cream hover:text-heritage-maroon border border-heritage-border/50'
                      }`}>
                      {name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── YEARS VIEW ── */}
            {viewMode === 'years' && (
              <div>
                <div className="flex items-center justify-between mb-2.5 bg-heritage-ivory/80 px-1.5 py-1 rounded-xl border border-heritage-border/60">
                  <button type="button" onClick={() => setYearGridStart(s => s - 12)} className="p-1 rounded hover:bg-heritage-cream"><ChevronLeft className="w-4 h-4 text-heritage-charcoal" /></button>
                  <span className="font-serif text-sm font-bold text-heritage-charcoal">{yearGridStart}–{yearGridStart + 11}</span>
                  <button type="button" onClick={() => setYearGridStart(s => s + 12)} className="p-1 rounded hover:bg-heritage-cream"><ChevronRight className="w-4 h-4 text-heritage-charcoal" /></button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const y = yearGridStart + i;
                    return (
                      <button key={y} type="button" onClick={() => { setViewYear(y); setViewMode('months'); }}
                        className={`py-1.5 rounded-xl text-xs font-medium transition-all ${viewYear === y ? 'bg-heritage-maroon text-[#FAF7EE] font-bold' : 'bg-heritage-ivory text-heritage-charcoal hover:bg-heritage-cream border border-heritage-border/50'}`}>
                        {y}
                      </button>
                    );
                  })}
                </div>
                {/* Quick decade jump */}
                <div className="pt-1.5 border-t border-heritage-border/60">
                  <p className="text-[10px] text-heritage-muted font-bold uppercase tracking-wider mb-1 text-center">Quick Jump</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {DECADE_PRESETS.map((dec) => (
                      <button key={dec} type="button" onClick={() => { setYearGridStart(dec); setViewYear(dec); }}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${Math.floor(viewYear / 10) * 10 === dec ? 'bg-heritage-gold-100 text-heritage-gold-900 border border-heritage-gold-400' : 'bg-heritage-ivory text-heritage-muted hover:text-heritage-charcoal border border-heritage-border'}`}>
                        {dec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-heritage-border/60">
              <button type="button" onClick={(e) => { clear(e); close(); }} className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors">
                Clear
              </button>
              <button type="button" onClick={selectToday} className="text-xs font-semibold text-heritage-maroon bg-heritage-gold-50 hover:bg-heritage-gold-100 px-3 py-1 rounded-lg border border-heritage-gold/40 transition-colors">
                Today
              </button>
            </div>
          </div>
        </CalendarPortal>
      )}
    </div>
  );
};
