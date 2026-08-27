import React, { useState, useEffect } from 'react';
import { Edit3, Phone, MapPin, Star, LogOut, ChefHat, TrendingUp, Trash2, Gift, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { DeleteAccountModal } from '../common/DeleteAccountModal';
import { avatarTone } from '../../utils/colors';

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
          className={i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );

  /* ─── מצב תצוגה ─── */
  if (!editing) {
    return (
      <div className="screen-enter space-y-4 pb-4">

        {/* כרטיס ראשי */}
        <div className="rounded-2xl p-5 text-white" style={{ background:'#1b1e38' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner"
                style={{ background: avatarTone(name).bg, color: avatarTone(name).fg }}>
                {initials}
              </div>
              <div>
                <div className="font-bold text-xl leading-tight">{name || 'שם לא הוגדר'}</div>
                {city && (
                  <div className="text-amber-100 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin size={12}/>{address ? `${address}, ${city}` : city}
                  </div>
                )}
                {rating > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <StarRow score={Math.round(rating)} />
                    <span className="text-white font-bold text-sm">{rating.toFixed(1)}</span>
                    <span className="text-orange-200 text-xs">({reviews.length} ביקורות)</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="bg-white/20 rounded-xl p-2.5">
              <Edit3 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <div className="font-bold text-xl">{rating > 0 ? rating.toFixed(1) : '—'}</div>
              <div className="text-amber-100 text-xs">דירוג</div>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <div className="font-bold text-xl">{totalShifts}</div>
              <div className="text-amber-100 text-xs">משמרות</div>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <div className="font-bold text-xl">₪{walletBalance.toLocaleString()}</div>
              <div className="text-amber-100 text-xs">ארנק</div>
            </div>
          </div>
        </div>

        {/* פרטי קשר */}
        <div className="bg-white rounded-2xl p-4 card-shadow space-y-0">
          <h3 className="font-bold text-gray-800 mb-3">פרטי המסעדה</h3>
          {[
            { icon: <Phone size={15} className="text-green-600"/>, bg: 'bg-green-100', label: 'טלפון',
              value: phone ? <a href={`tel:${phone}`} className="font-semibold text-gray-900">{phone}</a>
                           : <span className="text-gray-400 text-sm">לא הוזן</span> },
            { icon: <MapPin size={15} className="text-[#5354d3]"/>, bg: 'bg-[#ecebfd]', label: 'כתובת',
              value: <span className="font-semibold text-gray-900">{address ? `${address}, ${city}` : city || 'לא הוזנה'}</span> },
            { icon: <ChefHat size={15} className="text-blue-600"/>, bg: 'bg-blue-100', label: 'סגנון מטבח',
              value: <span className="font-semibold text-gray-900">{cuisineType || 'לא הוגדר'}</span> },
          ].map((row, i, arr) => (
            <div key={row.label} className={`flex items-center gap-3 py-3 ${i < arr.length-1 ? 'border-b border-gray-50' : ''}`}>
              <div className={`w-9 h-9 ${row.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {row.icon}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400">{row.label}</div>
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* ביקורות מעובדים */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-[#5354d3]" />
            <h3 className="font-bold text-gray-800">ביקורות מעובדים</h3>
            {reviews.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{reviews.length}</span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-4">
              <Star size={26} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">אין ביקורות עדיין</p>
              <p className="text-gray-300 text-xs mt-1">ביקורות יופיעו לאחר השלמת משמרות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{r.WorkerName || 'עובד'}</span>
                    <StarRow score={r.Score} />
                  </div>
                  {r.Comment && <p className="text-gray-600 text-xs leading-relaxed">{r.Comment}</p>}
                  <div className="text-gray-300 text-xs mt-1">
                    {new Date(r.CreatedAt).toLocaleDateString('he-IL')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* חבר מביא חבר */}
        <button onClick={() => navToRestaurant('referral')}
          className="w-full bg-white rounded-2xl p-4 card-shadow flex items-center gap-3 text-right active:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#5354d3' }}>
            <Gift size={18} style={{ color:'#ffffff' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-800 text-sm">חבר מביא חבר</div>
            <div className="text-xs text-gray-400">הזמן מסעדות וקבל חודש עמלה מופחתת</div>
          </div>
          <ChevronLeft size={18} className="text-gray-300" />
        </button>

        <button onClick={resetToLanding}
          className="w-full bg-gray-100 text-gray-600 rounded-2xl py-4 font-bold flex items-center justify-center gap-2">
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
        <h2 className="text-xl font-bold text-gray-900">עריכת פרופיל</h2>
        <button onClick={() => setEditing(false)} className="text-gray-400 text-sm">ביטול</button>
      </div>

      <div className="bg-white rounded-2xl p-4 card-shadow space-y-4">
        {[
          { label: 'שם המסעדה', val: name, set: setName, ph: 'שם המסעדה', type: 'text' },
          { label: 'טלפון', val: phone, set: setPhone, ph: '05X-XXXXXXX', type: 'tel' },
          { label: 'עיר', val: city, set: setCity, ph: 'עיר', type: 'text' },
          { label: 'כתובת (רחוב ומספר)', val: address, set: setAddress, ph: 'דיזנגוף 50', type: 'text' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">{f.label}</label>
            <input type={f.type} inputMode={f.type === 'tel' ? 'tel' : 'text'}
              value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-[#5354d3] outline-none" />
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">{error}</div>}

      <button onClick={handleSave} disabled={saving || !name}
        className="w-full bg-[#5354d3] text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50">
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
