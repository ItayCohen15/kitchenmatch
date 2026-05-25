import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

export const RestaurantProfile: React.FC = () => {
  const { userProfile, setUserProfile } = useApp();

  const [name, setName]         = useState(userProfile?.Name    || '');
  const [phone, setPhone]       = useState(userProfile?.Phone   || '');
  const [city, setCity]         = useState(userProfile?.City    || '');
  const [address, setAddress]   = useState(userProfile?.Address || '');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const handleSave = async () => {
    if (!userProfile?.Id) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await api.updateRestaurant(userProfile.Id, {
        name, city, address, phone,
        cuisineType: userProfile?.CuisineType || '',
      });
      const updated = res?.profile || { ...userProfile, Name: name, Phone: phone, City: city, Address: address };
      setUserProfile(updated);
      localStorage.setItem('km_profile', JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError('שגיאה בשמירה. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  const initials = name.slice(0, 2) || 'מ';

  return (
    <div className="screen-enter space-y-4">
      <h2 className="text-xl font-black text-gray-900">פרופיל המסעדה</h2>

      {/* Avatar */}
      <div className="flex justify-center py-2">
        <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-200">
          {initials}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-4 card-shadow space-y-4">

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">שם המסעדה</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="שם המסעדה"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">📞 מספר טלפון</label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="05X-XXXXXXX"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">עיר</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="עיר"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">כתובת (רחוב ומספר)</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="לדוגמה: דיזנגוף 50"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">{error}</div>
      )}

      {saved && (
        <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 text-center font-semibold">
          ✅ הפרטים נשמרו בהצלחה!
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !name}
        className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 shadow-lg shadow-orange-200"
      >
        {saving ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            שומר...
          </div>
        ) : 'שמור שינויים'}
      </button>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
        💡 הטלפון שלך יוצג לעובדים המאושרים כדי שיוכלו להתקשר אליך
      </div>
    </div>
  );
};
