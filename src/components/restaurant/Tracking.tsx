import React, { useEffect, useState } from 'react';
import { Phone, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MapView } from '../common/MapView';
import { api } from '../../api';

export const LiveTracking: React.FC = () => {
  const { navToRestaurant, startShift, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();
  const [eta, setEta] = useState(5);
  const [arrived, setArrived] = useState(false);
  const [confirmedJobs, setConfirmedJobs] = useState<any[]>([]);

  // טען משמרות מאושרות (סטטוס confirmed)
  useEffect(() => {
    if (!userProfile?.Id) return;
    api.getRestaurantJobs(userProfile.Id)
      .then(data => {
        const confirmed = Array.isArray(data)
          ? data.filter((j: any) => j.Status === 'confirmed')
          : [];
        setConfirmedJobs(confirmed);
      })
      .catch(() => {});
  }, [userProfile]);

  const activeJob = job || confirmedJobs[0];
  const workerName = activeJob?.WorkerName || 'העובד';
  const workerInit = workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const hourlyRate = activeJob?.HourlyRate || 0;

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

  const handleStartShift = async () => {
    startShift();
    if (activeJob?.Id) {
      await api.startJob(activeJob.Id).catch(() => {});
    }
    navToRestaurant('active_shift');
  };

  return (
    <div className="screen-enter flex flex-col gap-4">
      {/* Status header */}
      {!arrived ? (
        <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-black">
              {workerInit}
            </div>
            <div>
              <div className="font-bold text-lg">{workerName} בדרך</div>
              <div className="text-blue-100 text-sm">עובד אושר · ממתין להגעה</div>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white/15 rounded-xl p-3">
            <div className="text-center">
              <div className="text-2xl font-black">{eta}</div>
              <div className="text-blue-100 text-xs">דקות</div>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-black">₪{hourlyRate}</div>
              <div className="text-blue-100 text-xs">/שעה</div>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div className="text-center">
              <Clock size={20} className="mx-auto mb-0.5" />
              <div className="text-blue-100 text-xs">ממתין</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-l from-green-600 to-green-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={40} className="text-white" />
            <div>
              <div className="font-black text-xl">{workerName} הגיע!</div>
              <div className="text-green-100 text-sm">ממתין לצ׳ק-אין · לחץ להתחיל משמרת</div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-56 rounded-2xl overflow-hidden">
        <MapView
          showWorker={!arrived}
          workerName={workerName}
          restaurantName={userProfile?.Name || 'המסעדה'}
          mode="tracking"
        />
      </div>

      {/* Worker details card */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">
            {workerInit}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-base">{workerName}</div>
            <div className="text-gray-500 text-sm">
              {activeJob?.Role || 'עובד'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-orange-500 font-black text-lg">₪{hourlyRate}/ש׳</div>
          </div>
        </div>

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
      {arrived ? (
        <button
          onClick={handleStartShift}
          className="w-full bg-green-500 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-green-200 active:scale-98 transition-transform"
        >
          ✅ התחל משמרת
        </button>
      ) : (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">ציר זמן</h3>
          <div className="space-y-3">
            {[
              { label: 'משמרת פורסמה',    done: true  },
              { label: 'עובד הגיש מועמדות', done: true  },
              { label: 'מסעדה אישרה',      done: true  },
              { label: 'עובד בדרך',        done: true  },
              { label: 'הגעה למסעדה',      done: arrived },
              { label: 'משמרת התחילה',     done: false },
            ].map((event, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${event.done ? 'bg-green-500' : 'bg-gray-200'}`} />
                <span className={`flex-1 text-sm ${event.done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {event.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
