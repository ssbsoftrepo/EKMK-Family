import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  X, 
  Sparkles
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

// Quick decade presets tailored for 5-generation family tree genealogy (1900 to 2020s)
const DECADE_PRESETS = [1900, 1920, 1940, 1960, 1980, 2000, 2020];

export const HeritageDateInput: React.FC<HeritageDateInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date (DD/MM/YYYY)',
  required = false,
  disabled = false,
  className = '',
  helperText,
  max,
  min,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsedValue = useMemo(() => {
    if (!value || typeof value !== 'string') return null;
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, day: d };
      }
    }
    return null;
  }, [value]);

  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    };
  }, []);

  // Currently viewed month/year in calendar
  const [viewYear, setViewYear] = useState<number>(() => {
    return parsedValue ? parsedValue.year : today.year;
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return parsedValue ? parsedValue.month : today.month;
  });

  // Year grid start for 'years' view (12 years displayed)
  const [yearGridStart, setYearGridStart] = useState<number>(() => {
    const base = parsedValue ? parsedValue.year : today.year;
    return Math.floor(base / 12) * 12;
  });

  // Sync viewed year/month when value changes externally or when opening
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
      setYearGridStart(Math.floor(parsedValue.year / 12) * 12);
    }
  }, [parsedValue]);

  // Click outside and escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setViewMode('days');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Helper formatting for readable badge
  const formattedDisplay = useMemo(() => {
    if (!parsedValue) return '';
    const dateObj = new Date(parsedValue.year, parsedValue.month, parsedValue.day);
    if (isNaN(dateObj.getTime())) return value;
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [parsedValue, value]);

  // Calendar calculations
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const prevMonthDays = useMemo(() => {
    return new Date(viewYear, viewMonth, 0).getDate();
  }, [viewYear, viewMonth]);

  // Select day handler
  const handleSelectDay = (day: number) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateString = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    onChange(dateString);
    setIsOpen(false);
    setViewMode('days');
  };

  // Quick action: Today
  const handleSelectToday = () => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateString = `${today.year}-${pad(today.month + 1)}-${pad(today.day)}`;
    onChange(dateString);
    setViewYear(today.year);
    setViewMonth(today.month);
    setIsOpen(false);
    setViewMode('days');
  };

  // Clear date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Month navigation
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Year jump
  const prevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear((y) => y - 1);
  };

  const nextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewYear((y) => y + 1);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-heritage-charcoal">
            {label} {required && <span className="text-rose-600">*</span>}
          </label>
          {formattedDisplay && (
            <span className="text-[10px] font-semibold text-heritage-gold-800 bg-heritage-gold-50 px-2 py-0.5 rounded-full border border-heritage-gold-300">
              {formattedDisplay}
            </span>
          )}
        </div>
      )}

      {/* Input Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen && parsedValue) {
              setViewYear(parsedValue.year);
              setViewMonth(parsedValue.month);
              setYearGridStart(Math.floor(parsedValue.year / 12) * 12);
            }
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs bg-[#FFFEFB] border rounded-xl transition-all select-none cursor-pointer ${
          isOpen
            ? 'border-heritage-maroon ring-2 ring-heritage-maroon/15 shadow-heritage-sm'
            : 'border-heritage-border hover:border-heritage-gold shadow-xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-heritage-cream/30' : ''}`}
      >
        <div className="flex items-center space-x-2.5 truncate mr-2">
          <CalendarIcon className="w-4 h-4 text-heritage-gold-600 flex-shrink-0" />
          {formattedDisplay ? (
            <span className="font-semibold text-heritage-charcoal truncate">
              {formattedDisplay}
              <span className="ml-2 text-[10px] text-heritage-muted font-normal font-mono">
                ({value})
              </span>
            </span>
          ) : (
            <span className="text-heritage-muted select-none truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              className="p-1 rounded-full text-heritage-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              value ? 'bg-heritage-gold' : 'bg-heritage-border'
            }`}
          />
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-heritage-muted mt-1">{helperText}</p>
      )}

      {/* Heritage Popover Calendar */}
      {isOpen && (
        <div 
          className="absolute left-0 mt-1.5 w-[310px] sm:w-[325px] bg-[#FFFEFB] border-2 border-heritage-gold/50 rounded-2xl shadow-heritage-lg z-50 p-3.5 animate-fadeIn backdrop-blur-md"
          style={{ filter: 'drop-shadow(0 12px 28px rgba(112, 45, 59, 0.14))' }}
        >
          {/* Top Decorative Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-heritage-border/80">
            <span className="text-[10px] font-bold uppercase tracking-widest text-heritage-maroon flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-heritage-gold-600" />
              <span>Heritage Calendar</span>
            </span>
            <span className="text-[10px] text-heritage-muted font-serif italic">
              Erode KMK Archive
            </span>
          </div>

          {/* VIEW 1: DAYS CALENDAR VIEW */}
          {viewMode === 'days' && (
            <div>
              {/* Month & Year Navigation Header */}
              <div className="flex items-center justify-between mb-3 bg-heritage-ivory/80 p-1.5 rounded-xl border border-heritage-border/70">
                <div className="flex items-center space-x-0.5">
                  <button
                    type="button"
                    onClick={prevYear}
                    title="Previous Year (-1 yr)"
                    className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-muted hover:text-heritage-maroon transition-colors"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={prevMonth}
                    title="Previous Month"
                    className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-charcoal hover:text-heritage-maroon transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-1 font-serif text-xs font-bold text-heritage-charcoal">
                  <button
                    type="button"
                    onClick={() => setViewMode('months')}
                    className="px-2 py-0.5 rounded-lg hover:bg-heritage-gold/20 hover:text-heritage-maroon transition-colors cursor-pointer"
                    title="Choose month"
                  >
                    {MONTH_NAMES[viewMonth]}
                  </button>
                  <span className="text-heritage-gold-600 font-sans">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setYearGridStart(Math.floor(viewYear / 12) * 12);
                      setViewMode('years');
                    }}
                    className="px-2 py-0.5 rounded-lg hover:bg-heritage-gold/20 hover:text-heritage-maroon transition-colors cursor-pointer"
                    title="Choose year / decade"
                  >
                    {viewYear}
                  </button>
                </div>

                <div className="flex items-center space-x-0.5">
                  <button
                    type="button"
                    onClick={nextMonth}
                    title="Next Month"
                    className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-charcoal hover:text-heritage-maroon transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextYear}
                    title="Next Year (+1 yr)"
                    className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-muted hover:text-heritage-maroon transition-colors"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Weekday Header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {DAYS_OF_WEEK.map((d, idx) => (
                  <span
                    key={d}
                    className={`text-[10px] font-bold uppercase tracking-wider py-1 ${
                      idx === 0 || idx === 6 ? 'text-heritage-maroon' : 'text-heritage-muted'
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid (6 rows x 7 cols) */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {/* Previous month filler days */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                  const dayNum = prevMonthDays - firstDayOfWeek + 1 + i;
                  return (
                    <div
                      key={`prev-${i}`}
                      className="h-8 flex items-center justify-center text-heritage-muted/30 text-[11px] select-none"
                    >
                      {dayNum}
                    </div>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected =
                    parsedValue &&
                    parsedValue.year === viewYear &&
                    parsedValue.month === viewMonth &&
                    parsedValue.day === dayNum;

                  const isToday =
                    today.year === viewYear &&
                    today.month === viewMonth &&
                    today.day === dayNum;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`h-8 rounded-lg flex items-center justify-center text-[12px] font-medium transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-heritage-maroon text-[#FAF7EE] font-bold shadow-sm ring-2 ring-heritage-gold/50'
                          : isToday
                          ? 'border border-heritage-gold/80 text-heritage-maroon bg-heritage-gold-50/50 hover:bg-heritage-gold/20 font-semibold'
                          : 'text-heritage-charcoal hover:bg-heritage-cream/70 hover:text-heritage-maroon'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {isToday && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-heritage-gold absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: MONTHS VIEW (12-Month Grid) */}
          {viewMode === 'months' && (
            <div>
              <div className="flex items-center justify-between mb-3 bg-heritage-ivory/80 p-1.5 rounded-xl border border-heritage-border/70">
                <button
                  type="button"
                  onClick={prevYear}
                  className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-charcoal"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearGridStart(Math.floor(viewYear / 12) * 12);
                    setViewMode('years');
                  }}
                  className="font-serif text-sm font-bold text-heritage-maroon hover:underline"
                >
                  Year {viewYear}
                </button>
                <button
                  type="button"
                  onClick={nextYear}
                  className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-charcoal"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1">
                {MONTH_NAMES.map((name, idx) => {
                  const isCurrent = viewMonth === idx;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx);
                        setViewMode('days');
                      }}
                      className={`py-2 px-1 text-xs rounded-xl font-medium transition-all ${
                        isCurrent
                          ? 'bg-heritage-maroon text-[#FAF7EE] font-bold shadow-xs'
                          : 'bg-heritage-ivory/50 text-heritage-charcoal hover:bg-heritage-cream hover:text-heritage-maroon border border-heritage-border/50'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: YEARS VIEW (Decade-Based Genealogy Navigation) */}
          {viewMode === 'years' && (
            <div>
              <div className="flex items-center justify-between mb-3 bg-heritage-ivory/80 p-1.5 rounded-xl border border-heritage-border/70">
                <button
                  type="button"
                  onClick={() => setYearGridStart((s) => s - 12)}
                  title="Previous 12 Years"
                  className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-charcoal"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-serif text-xs font-bold text-heritage-charcoal">
                  {yearGridStart} — {yearGridStart + 11}
                </span>
                <button
                  type="button"
                  onClick={() => setYearGridStart((s) => s + 12)}
                  title="Next 12 Years"
                  className="p-1 rounded-lg hover:bg-heritage-cream text-heritage-charcoal"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 12-Year Grid */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {Array.from({ length: 12 }).map((_, i) => {
                  const y = yearGridStart + i;
                  const isSelected = viewYear === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        setViewMode('months');
                      }}
                      className={`py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-heritage-maroon text-[#FAF7EE] font-bold shadow-xs'
                          : 'bg-heritage-ivory/50 text-heritage-charcoal hover:bg-heritage-cream hover:text-heritage-maroon border border-heritage-border/50'
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>

              {/* Quick Decade Jump Bar for Genealogists */}
              <div className="pt-2 border-t border-heritage-border/70">
                <p className="text-[10px] text-heritage-muted font-bold uppercase tracking-wider mb-1.5 text-center">
                  Quick Decade Jump (Lineage Era)
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {DECADE_PRESETS.map((dec) => (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => {
                        setYearGridStart(dec);
                        setViewYear(dec);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors ${
                        Math.floor(viewYear / 10) * 10 === dec
                          ? 'bg-heritage-gold-100 text-heritage-gold-900 border border-heritage-gold-400 font-bold'
                          : 'bg-heritage-ivory text-heritage-muted hover:text-heritage-charcoal border border-heritage-border'
                      }`}
                    >
                      {dec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Footer Actions */}
          <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-heritage-border/80">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Clear
            </button>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleSelectToday}
                className="text-[11px] font-semibold text-heritage-maroon bg-heritage-gold-50 hover:bg-heritage-gold-100 px-3 py-1 rounded-lg border border-heritage-gold/40 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setViewMode('days');
                }}
                className="text-[11px] font-semibold text-[#FAF7EE] bg-heritage-maroon hover:bg-heritage-maroon-800 px-3 py-1 rounded-lg transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
