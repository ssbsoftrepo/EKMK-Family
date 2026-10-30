import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface HeritageSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyOptionLabel?: string;
  allowClear?: boolean;
  searchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

export const HeritageSelect: React.FC<HeritageSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  emptyOptionLabel = 'None / Clear selection',
  allowClear = true,
  searchable = true,
  required = false,
  disabled = false,
  className = '',
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-heritage-charcoal mb-1">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full min-h-[38px] px-3 py-1.5 bg-[#FFFEFB] border rounded-xl flex items-center justify-between cursor-pointer transition-all text-xs ${
          isOpen
            ? 'border-heritage-maroon ring-2 ring-heritage-maroon/15 shadow-sm'
            : 'border-heritage-border hover:border-heritage-gold'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-heritage-cream/30' : ''}`}
      >
        <div className="flex items-center space-x-2 overflow-hidden flex-1 mr-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="flex-shrink-0 text-heritage-gold-600">
                  {selectedOption.icon}
                </span>
              )}
              <div className="flex items-center space-x-2 truncate">
                <span className="font-medium text-heritage-charcoal truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-heritage-gold-100 text-heritage-gold-900 border border-heritage-gold-300 flex-shrink-0">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-heritage-muted select-none">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              className="p-1 rounded-full text-heritage-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-heritage-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-heritage-maroon' : ''
            }`}
          />
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-heritage-muted mt-1">{helperText}</p>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-[#FFFEFB] border border-heritage-border rounded-xl shadow-heritage-lg z-50 overflow-hidden animate-fadeIn max-h-72 flex flex-col">
          {searchable && options.length > 5 && (
            <div className="p-2 border-b border-heritage-border bg-heritage-ivory/60 sticky top-0 z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-heritage-muted absolute left-2.5 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search name, gen, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#FFFEFB] border border-heritage-border rounded-lg focus:outline-none focus:border-heritage-maroon"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-heritage-muted hover:text-heritage-charcoal"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="overflow-y-auto divide-y divide-heritage-border/40 py-1">
            {allowClear && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  !value
                    ? 'bg-heritage-gold-50/80 text-heritage-maroon font-semibold'
                    : 'text-heritage-muted hover:bg-heritage-cream/40 hover:text-heritage-charcoal'
                }`}
              >
                <span className="italic">{emptyOptionLabel}</span>
                {!value && <Check className="w-3.5 h-3.5 text-heritage-maroon" />}
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-heritage-gold-50 text-heritage-maroon font-semibold'
                        : 'text-heritage-charcoal hover:bg-heritage-cream/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      {opt.icon && (
                        <span className="flex-shrink-0 text-heritage-gold-600">
                          {opt.icon}
                        </span>
                      )}
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-heritage-gold-100 text-heritage-gold-900 border border-heritage-gold-300">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <p className="text-[10px] text-heritage-muted truncate">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-heritage-maroon flex-shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-heritage-muted">
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
