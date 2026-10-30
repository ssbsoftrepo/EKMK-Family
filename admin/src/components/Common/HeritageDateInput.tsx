import React from 'react';
import { Calendar, X } from 'lucide-react';

interface HeritageDateInputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  max?: string;
  min?: string;
}

export const HeritageDateInput: React.FC<HeritageDateInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  required = false,
  disabled = false,
  className = '',
  helperText,
  max,
  min,
}) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Format readable preview if valid date
  const formatReadableDate = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === '') return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        }
      } else if (parts.length === 1 && parts[0].length === 4) {
        return `Year ${parts[0]}`;
      }
    } catch {
      // ignore
    }
    return '';
  };

  const readable = formatReadableDate(value);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-heritage-charcoal">
            {label} {required && <span className="text-rose-600">*</span>}
          </label>
          {readable && (
            <span className="text-[10px] font-semibold text-heritage-gold-700 bg-heritage-gold-50 px-1.5 py-0.2 rounded border border-heritage-gold-200">
              {readable}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <Calendar className="w-4 h-4 text-heritage-gold-600 absolute left-3 pointer-events-none" />

        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          max={max}
          min={min}
          className={`w-full pl-9 pr-8 py-2 text-xs bg-[#FFFEFB] border border-heritage-border rounded-xl transition-all focus:outline-none focus:border-heritage-maroon focus:ring-2 focus:ring-heritage-maroon/15 ${
            disabled ? 'opacity-60 cursor-not-allowed bg-heritage-cream/30' : 'hover:border-heritage-gold'
          }`}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear date"
            className="absolute right-2.5 p-1 rounded-full text-heritage-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-heritage-muted mt-1">{helperText}</p>
      )}
    </div>
  );
};
