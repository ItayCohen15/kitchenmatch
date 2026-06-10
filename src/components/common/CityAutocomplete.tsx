import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CITY_COORDS } from '../../utils/cities';

// כל הערים בישראל, ממוינות בעברית
const ALL_CITIES = Object.keys(CITY_COORDS).sort((a, b) => a.localeCompare(b, 'he'));

interface Props {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

export const CityAutocomplete: React.FC<Props> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  // סנכרון אם הערך משתנה מבחוץ
  useEffect(() => { setQuery(value); }, [value]);

  // סגירה בלחיצה מחוץ לרכיב
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim();
    if (!q) return ALL_CITIES.slice(0, 8);
    const starts = ALL_CITIES.filter(c => c.startsWith(q));
    const includes = ALL_CITIES.filter(c => !c.startsWith(q) && c.includes(q));
    return [...starts, ...includes].slice(0, 10);
  }, [query]);

  const pick = (c: string) => { onChange(c); setQuery(c); setOpen(false); };

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || 'הקלד עיר...'}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none text-gray-900 font-medium"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {matches.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => pick(c)}
              className="w-full text-right px-4 py-2.5 text-sm text-gray-800 hover:bg-amber-50 border-b border-gray-50 last:border-0"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
