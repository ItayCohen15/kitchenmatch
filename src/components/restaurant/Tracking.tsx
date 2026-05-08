import React, { useEffect, useState } from 'react';
import { Phone, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MapView } from '../common/MapView';
import { WORKERS } from '../../data/mockData';

export const LiveTracking: React.FC = () => {
  const { navToRestaurant, startShift } = useApp();
  const worker = WORKERS[0];
  const [eta, setEta] = useState(5);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (arrived) return;
    const interval = setInterval(() => {
      setEta(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setArrived(true);
          return 0;
        }
        return prev - 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [arrived]);

  const handleStartShift = () => {
    startShift();
    navToRestaurant('active_shift');
  };

  return (
    <div className="screen-enter flex flex-col gap-4">
      {/* Status header */}
      {!arrived ? (
        <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black"
              style={{ backgroundColor: worker.avatarColor }}
            >
              {worker.initials}
            </div>
            <div>
              <div className="font-bold text-lg">{worker.name} בדרך</div>
              <div className="text-blue-100 text-sm">שף · Gold Level ⭐</div>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white/15 rounded-xl p-3">
            <div className="text-center">
              <div className="text-2xl font-black">{eta}</div>
              <div className="text-blue-100 text-xs">דקות</div>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-black">{worker.distanceKm}</div>
              <div className="text-blue-100 text-xs">ק״מ</div>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-black">★{worker.rating}</div>
              <div className="text-blue-100 text-xs">דירוג</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-l from-green-600 to-green-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={40} className="text-white" />
            <div>
              <div className="font-black text-xl">{worker.name} הגיע!</div>
              <div className="text-green-100 text-sm">ממתין לצ׳ק-אין · לחץ להתחיל משמרת</div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-56 rounded-2xl overflow-hidden">
        <MapView
          showWorker={!arrived}
          workerName={worker.name}
          restaurantName="מסעדת הגן"
          mode="tracking"
        />
      </div>

      {/* Worker details card */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl"
            style={{ backgroundColor: worker.avatarColor }}
          >
            {worker.initials}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-base">{worker.name}</div>
            <div className="text-gray-500 text-sm">{worker.yearsExp} שנות ניסיון</div>
            <div className="flex gap-1 flex-wrap mt-1">
              {worker.skills.slice(0, 3).map(s => (
                <span key={s} className="text-xs bg-orange-50 text-orange-600 rounded-full px-2 py-0.5">{s}</span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-orange-500 font-black text-lg">₪{worker.hourlyRate}/ש׳</div>
            <div className="text-yellow-500 text-sm font-bold">★ {worker.rating}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl py-3 text-gray-700 font-semibold text-sm">
            <Phone size={16} />
            התקשר
          </button>
          <button
            onClick={() => navToRestaurant('active_shift')}
            className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl py-3 text-gray-700 font-semibold text-sm"
          >
            <MessageCircle size={16} />
            שלח הודעה
          </button>
        </div>
      </div>

      {/* Start shift button */}
      {arrived && (
        <button
          onClick={handleStartShift}
          className="w-full bg-green-500 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-green-200 active:scale-98 transition-transform"
        >
          ✅ התחל משמרת
        </button>
      )}

      {!arrived && (
        <div className="text-center text-sm text-gray-400">
          הכפתור יופיע כשהשף יגיע
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">ציר זמן</h3>
        <div className="space-y-3">
          {[
            { label: 'משמרת פורסמה', time: '17:45', done: true },
            { label: 'שף שובץ', time: '17:48', done: true },
            { label: 'בדרך למסעדה', time: '17:50', done: true },
            { label: 'הגעה למסעדה', time: `~18:0${eta}`, done: arrived },
            { label: 'משמרת התחילה', time: '–', done: false },
          ].map((event, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${event.done ? 'bg-green-500' : 'bg-gray-200'}`} />
              <span className={`flex-1 text-sm ${event.done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{event.label}</span>
              <span className="text-xs text-gray-400">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
