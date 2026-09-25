import React, { useState, useEffect } from 'react';
import { Edit3, Phone, MapPin, Star, LogOut, ChefHat, TrendingUp, Trash2, Gift, ChevronLeft, Building2, Wallet, CalendarCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { DeleteAccountModal } from '../common/DeleteAccountModal';
import { avatarTone } from '../../utils/colors';
import { BUSINESS_TYPE_LABELS } from '../../data/mockData';

const CARD_STYLE = {
  background: '#fff',
  border: '1px solid #eceef4',
  borderRadius: 20,
  boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)',
} as const;

export const RestaurantProfile: React.FC = () => {
  const { userProfile, setUserProfile, resetToLanding, navToRestaurant } = useApp();
  const [editing, setEditing] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [totalShifts, setTotalShifts] = useState(0);
  const [showDelete, setShowDelete] = useState(false); // מודל מחיקת חשבון

  const [name, setName]       = useState(userProfile?.Name    || '');
  const [phone, setPhone]     = useState(userProfile?.Phone   || '');
  const [city, setCity]       = useState(userProfile?.City    || '');
  const [address, setAddress] = useState(userProfile?.Address || '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const rating      = userProfile?.Rating        || 0;
  const walletBalance = userProfile?.WalletBalance || 0;
  const cuisineType = userProfile?.CuisineType   || '';
  const initials    = (name || 'מ').slice(0, 2);

  useEffect(() => {
    if (!userProfile?.Id || editing) return;
    // טען ביקורות
    api.getRestaurantRatings(userProfile.Id)
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {});
    // טען מספר משמרות
    api.getRestaurantJobs(userProfile.Id)
      .then(data => {
        const completed = Array.isArray(data) ? data.filter((j: any) => j.Status === 'completed').length : 0;
        setTotalShifts(completed);
      })
      .catch(() => {});
  }, [userProfile?.Id, editing]);

  const handleSave = async () => {
    if (!userProfile?.Id) return;
    setSaving(true); setError('');
    try {
      const res = await api.updateRestaurant(userProfile.Id, {
        name, city, address, phone,
        cuisineType: userProfile?.CuisineType || '',
        businessType: userProfile?.BusinessType || 'restaurant', // שמור — אחרת ידרס ל'restaurant'
      });
      const updated = res?.profile || { ...userProfile, Name: name, Phone: phone, City: city, Address: address };
      setUserProfile(updated);
      localStorage.setItem('km_profile', JSON.stringify(updated));
      setEditing(false);
    } catch {
      setError('שגיאה בשמירה. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  const StarRow = ({ score }: { score: number }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12}
          style={i <= score ? { color: '#f4b62c', fill: '#f4b62c' } : { color: '#e3e6ef', fill: '#e3e6ef' }} />
      ))}
    </div>
  );

  /* ─── מצב תצוגה ─── */
  if (!editing) {
    const stats = [
      { icon: <Star size={19} style={{ fill: 'currentColor' }} />, gold: true,  value: rating > 0 ? rating.toFixed(1) : '—', label: 'דירוג' },
      { icon: <CalendarCheck size={19} />,                          gold: false, value: totalShifts,                          label: 'משמרות' },
      { icon: <Wallet size={19} />,                                 gold: true,  value: `₪${walletBalance.toLocaleString()}`, label: 'ארנק' },
    ];

    return (
      <div className="screen-enter space-y-4 pb-4">

        {/* כרטיס ראשי — הירו נייבי */}
        <div className="relative rounded-3xl overflow-hidden" style={{ background: '#141a2e' }}>
          {/* אקסנטים רדיאליים — זהב + אינדיגו */}
          <div className="absolute pointer-events-none" style={{ width: 260, height: 260, borderRadius: '50%', bottom: -120, left: -80, background: 'radial-gradient(circle, rgba(244,182,44,.20), transparent 66%)' }} />
          <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', top: -80, left: 40, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />

          <div className="relative p-5 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl"
                  style={{ background: avatarTone(name).bg, color: avatarTone(name).fg }}>
                  {initials}
                </div>
                <div>
                  <div className="font-black text-xl leading-tight">{name || 'שם לא הוגדר'}</div>
                  {city && (
                    <div className="text-sm flex items-center gap-1 mt-1" style={{ color: '#cdd3e8' }}>
                      <MapPin size={13} style={{ color: '#f4b62c' }} />{address ? `${address}, ${city}` : city}
                    </div>
                  )}
                  {rating > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <StarRow score={Math.round(rating)} />
                      <span className="text-white font-bold text-sm">{rating.toFixed(1)}</span>
                      <span className="text-xs" style={{ color: '#9aa0c0' }}>({reviews.length} ביקורות)</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setEditing(true)} className="rounded-xl p-2.5 active:scale-95 transition-transform"
                style={{ background: 'rgba(255,255,255,.12)' }}>
                <Edit3 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="rounded-2xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
                  <div className="flex justify-center mb-1" style={{ color: s.gold ? '#f4b62c' : '#8b8cf0' }}>{s.icon}</div>
                  <div className="font-black text-lg">{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#b9c0d8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* פרטי העסק */}
        <div className="p-4 space-y-0" style={CARD_STYLE}>
          <h3 className="font-black mb-3" style={{ color: '#141a2e' }}>פרטי העסק</h3>
          {[
            { icon: <Building2 size={15} className="text-[#5354d3]"/>, bg: 'bg-[#ecebfd]', label: 'סוג העסק',
              value: <span className="font-semibold" style={{ color: '#141a2e' }}>{BUSINESS_TYPE_LABELS[userProfile?.BusinessType] || 'מסעדה'}</span> },
            { icon: <Phone size={15} className="text-green-600"/>, bg: 'bg-green-100', label: 'טלפון',
              value: phone ? <a href={`tel:${phone}`} className="font-semibold" style={{ color: '#141a2e' }}>{phone}</a>
                           : <span className="text-sm" style={{ color: '#9aa0b8' }}>לא הוזן</span> },
            { icon: <MapPin size={15} className="text-[#5354d3]"/>, bg: 'bg-[#ecebfd]', label: 'כתובת',
              value: <span className="font-semibold" style={{ color: '#141a2e' }}>{address ? `${address}, ${city}` : city || 'לא הוזנה'}</span> },
            { icon: <ChefHat size={15} className="text-blue-600"/>, bg: 'bg-blue-100', label: 'סגנון מטבח',
              value: <span className="font-semibold" style={{ color: '#141a2e' }}>{cuisineType || 'לא הוגדר'}</span> },
          ].map((row, i, arr) => (
            <div key={row.label} className="flex items-center gap-3 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #eceef4' : 'none' }}>
              <div className={`w-9 h-9 ${row.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {row.icon}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold" style={{ color: '#7a8199' }}>{row.label}</div>
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* ביקורות מעובדים */}
        <div className="p-4" style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-[#5354d3]" />
            <h3 className="font-black" style={{ color: '#141a2e' }}>ביקורות מעובדים</h3>
            {reviews.length > 0 && (
              <span className="text-xs font-extrabold px-2 py-0.5" style={{ background: '#f4f5f9', color: '#7a8199', borderRadius: 6 }}>{reviews.length}</span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-4">
              <Star size={26} className="mx-auto mb-2" style={{ color: '#d3d7e3', fill: '#d3d7e3' }} />
              <p className="text-sm font-semibold" style={{ color: '#7a8199' }}>אין ביקורות עדיין</p>
              <p className="text-xs mt-1" style={{ color: '#9aa0b8' }}>ביקורות יופיעו לאחר השלמת משמרות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="rounded-xl p-3" style={{ background: '#f4f5f9', border: '1px solid #eceef4' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm" style={{ color: '#141a2e' }}>{r.WorkerName || 'עובד'}</span>
                    <StarRow score={r.Score} />
                  </div>
                  {r.Comment && <p className="text-xs leading-relaxed" style={{ color: '#6b7290' }}>{r.Comment}</p>}
                  <div className="text-xs mt-1" style={{ color: '#9aa0b8' }}>
                    {new Date(r.CreatedAt).toLocaleDateString('he-IL')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* חבר מביא חבר */}
        <button onClick={() => navToRestaurant('referral')}
          className="w-full p-4 flex items-center gap-3 text-right active:scale-[0.99] transition-transform" style={CARD_STYLE}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#5354d3' }}>
            <Gift size={18} style={{ color: '#ffffff' }} />
          </div>
          <div className="flex-1">
            <div className="font-black text-sm" style={{ color: '#141a2e' }}>חבר מביא חבר</div>
            <div className="text-xs" style={{ color: '#7a8199' }}>הזמן מסעדות וקבל חודש עמלה מופחתת</div>
          </div>
          <ChevronLeft size={18} style={{ color: '#c2c7da' }} />
        </button>

        <button onClick={resetToLanding}
          className="w-full rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          style={{ background: '#f4f5f9', color: '#6b7290' }}>
          <LogOut size={18} /> התנתק
        </button>

        {/* אזור מסוכן — מחיקת חשבון */}
        <button onClick={() => setShowDelete(true)}
          className="w-full text-red-500 rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2 active:bg-red-50 transition-colors">
          <Trash2 size={15} /> מחיקת החשבון שלי
        </button>

        {showDelete && (
          <DeleteAccountModal
            onClose={() => setShowDelete(false)}
            onDeleted={() => {
              try { localStorage.clear(); } catch { /* ignore */ }
              resetToLanding();
            }}
          />
        )}
      </div>
    );
  }

  /* ─── מצב עריכה ─── */
  return (
    <div className="screen-enter space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: '#141a2e' }}>עריכת פרופיל</h2>
        <button onClick={() => setEditing(false)} className="text-sm font-semibold" style={{ color: '#7a8199' }}>ביטול</button>
      </div>

      <div className="p-4 space-y-4" style={CARD_STYLE}>
        {[
          { label: 'שם המסעדה', val: name, set: setName, ph: 'שם המסעדה', type: 'text' },
          { label: 'טלפון', val: phone, set: setPhone, ph: '05X-XXXXXXX', type: 'tel' },
          { label: 'עיר', val: city, set: setCity, ph: 'עיר', type: 'text' },
          { label: 'כתובת (רחוב ומספר)', val: address, set: setAddress, ph: 'דיזנגוף 50', type: 'text' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#7a8199' }}>{f.label}</label>
            <input type={f.type} inputMode={f.type === 'tel' ? 'tel' : 'text'}
              value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              className="w-full rounded-xl px-4 py-3 text-right outline-none focus:border-[#5354d3]"
              style={{ border: '1px solid #eceef4', color: '#141a2e' }} />
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">{error}</div>}

      <button onClick={handleSave} disabled={saving || !name}
        className="w-full text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 active:scale-[0.99] transition-transform"
        style={{ background: '#5354d3' }}>
        {saving
          ? <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              שומר...
            </div>
          : 'שמור שינויים'}
      </button>
    </div>
  );
};
