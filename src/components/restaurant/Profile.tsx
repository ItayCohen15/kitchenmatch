import React, { useState } from 'react';
import { Edit3, Phone, MapPin, Star, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

export const RestaurantProfile: React.FC = () => {
  const { userProfile, setUserProfile, resetToLanding } = useApp();
  const [editing, setEditing] = useState(false);

  const [name, setName]       = useState(userProfile?.Name    || '');
  const [phone, setPhone]     = useState(userProfile?.Phone   || '');
  const [city, setCity]       = useState(userProfile?.City    || '');
  const [address, setAddress] = useState(userProfile?.Address || '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const rating        = userProfile?.Rating       || 0;
  const walletBalance = userProfile?.WalletBalance|| 0;
  const cuisineType   = userProfile?.CuisineType  || '';
  const initials      = (name || 'מ').slice(0, 2);

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

  /* ─── מצב תצוגה ─── */
  if (!editing) {
    return (
      <div className="screen-enter space-y-4">
        {/* כרטיס ראשי */}
        <div className="bg-gradient-to-l from-orange-600 to-orange-500 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-black text-2xl">
                {initials}
              </div>
              <div>
                <div className="font-black text-xl leading-tight">{name || 'שם לא הוגדר'}</div>
                {city && <div className="text-orange-100 text-sm flex items-center gap-1 mt-0.5"><MapPin size={12}/>{city}</div>}
              </div>
            </div>
            <button onClick={() => setEditing(true)}
              className="bg-white/20 rounded-xl p-2.5">
              <Edit3 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <div className="font-black text-lg">{rating > 0 ? rating.toFixed(1) : '—'}</div>
              <div className="text-orange-100 text-xs">דירוג ⭐</div>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <div className="font-black text-lg">₪{walletBalance.toLocaleString()}</div>
              <div className="text-orange-100 text-xs">ארנק</div>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <div className="font-black text-sm">{cuisineType ? cuisineType.split(',')[0] : '—'}</div>
              <div className="text-orange-100 text-xs">מטבח</div>
            </div>
          </div>
        </div>

        {/* פרטי קשר */}
        <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
          <h3 className="font-bold text-gray-800">פרטי קשר</h3>

          <div className="flex items-center gap-3 py-2 border-b border-gray-50">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400">טלפון</div>
              {phone ? (
                <a href={`tel:${phone}`} className="font-semibold text-gray-900">{phone}</a>
              ) : (
                <span className="text-gray-400 text-sm">לא הוזן — לחץ ערוך</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400">כתובת</div>
              <div className="font-semibold text-gray-900">
                {address ? `${address}, ${city}` : city || 'לא הוזנה'}
              </div>
            </div>
          </div>
        </div>

        {/* סגנונות מטבח */}
        {cuisineType && (
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <h3 className="font-bold text-gray-800 mb-3">סגנונות מטבח</h3>
            <div className="flex flex-wrap gap-2">
              {cuisineType.split(',').filter(Boolean).map(c => (
                <span key={c} className="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full">{c.trim()}</span>
              ))}
            </div>
          </div>
        )}

        <button onClick={resetToLanding}
          className="w-full bg-gray-100 text-gray-600 rounded-2xl py-4 font-bold flex items-center justify-center gap-2">
          <LogOut size={18} /> התנתק
        </button>
      </div>
    );
  }

  /* ─── מצב עריכה ─── */
  return (
    <div className="screen-enter space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">עריכת פרופיל</h2>
        <button onClick={() => setEditing(false)} className="text-gray-400 text-sm">ביטול</button>
      </div>

      <div className="bg-white rounded-2xl p-4 card-shadow space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">שם המסעדה</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="שם המסעדה"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">📞 טלפון</label>
          <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="05X-XXXXXXX"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">עיר</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="עיר"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">כתובת</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            placeholder="רחוב ומספר"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none" />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">{error}</div>}

      <button onClick={handleSave} disabled={saving || !name}
        className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 shadow-lg shadow-orange-200">
        {saving ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            שומר...
          </div>
        ) : '✅ שמור שינויים'}
      </button>
    </div>
  );
};
