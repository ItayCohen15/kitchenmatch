import React, { useState, useEffect, useRef, useMemo } from 'react';

// מאגר הרחובות הרשמי של ישראל (data.gov.il, חינמי, CORS פתוח)
const RESOURCE = '1b14e41c-85b3-4c21-bdce-9fe48185ffca';

interface Props {
  city: string;
  value: string;
  onChange: (street: string) => void;
}

export const StreetAutocomplete: React.FC<Props> = ({ city, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [streets, setStreets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Record<string, string[]>>({});

  useEffect(() => { setQuery(value); }, [value]);

  // סגירה בלחיצה מחוץ לרכיב
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // טעינת כל רחובות העיר פעם אחת (כשמשתנה עיר), עם מטמון
  useEffect(() => {
    const cityCore = (city || '').split(/[-(]/)[0].trim();
    if (!cityCore) { setStreets([]); return; }
    if (cacheRef.current[cityCore]) { setStreets(cacheRef.current[cityCore]); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const q = encodeURIComponent(JSON.stringify({ city_name: cityCore }));
        const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${RESOURCE}&q=${q}&fields=street_name,city_name&limit=15000`;
        const r = await fetch(url);
        const j = await r.json();
        const list = [...new Set((j?.result?.records || [])
          .filter((x: any) => (x.city_name || '').trim().startsWith(cityCore))
          .map((x: any) => (x.street_name || '').trim())
          .filter((s: string) => s && s !== 'ללא שם'))]
          .sort((a, b) => (a as string).localeCompare(b as string, 'he')) as string[];
        if (!cancelled) { cacheRef.current[cityCore] = list; setStreets(list); }
      } catch {
        if (!cancelled) setStreets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [city]);

  const matches = useMemo(() => {
    const qs = query.trim();
    if (!qs) return streets.slice(0, 12);
    const starts = streets.filter(s => s.startsWith(qs));
    const incl = streets.filter(s => !s.startsWith(qs) && s.includes(qs));
    return [...starts, ...incl].slice(0, 12);
  }, [query, streets]);

  const pick = (s: string) => { onChange(s); setQuery(s); setOpen(false); };
  const disabled = !city;

  return (
    <div className="relative flex-1" ref={wrapRef}>
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={disabled ? 'בחר עיר קודם' : 'שם הרחוב'}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none disabled:bg-gray-50 disabled:text-gray-400"
      />
      {open && !disabled && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-2.5 text-sm text-gray-400 text-right">טוען רחובות…</div>
          ) : matches.length > 0 ? matches.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              className="w-full text-right px-4 py-2.5 text-sm text-gray-800 hover:bg-amber-50 border-b border-gray-50 last:border-0"
            >
              {s}
            </button>
          )) : (
            <div className="px-4 py-2.5 text-sm text-gray-400 text-right">לא נמצא — אפשר להקליד ידנית</div>
          )}
        </div>
      )}
    </div>
  );
};
