import React, { useEffect, useState } from 'react';
import { Navigation2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MapView } from '../common/MapView';
import { api } from '../../api';

export const WorkerNavigation: React.FC = () => {
  const { navToWorker, getSelectedJob, startShift } = useApp();
  const job = getSelectedJob();
  const [eta, setEta] = useState(6);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (arrived) return;
    const iv = setInterval(() => {
      setEta(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          setArrived(true);
          return 0;
        }
        return prev - 1;
      });
    }, 5000);
    return () => clearInterval(iv);
  }, [arrived]);

  const restaurantName = job?.RestaurantName || job?.restaurantName || 'המסעדה';
  const restaurantCity = job?.RestaurantCity || job?.restaurantCity || '';
  const hourlyRate: number = job ? Number(job.HourlyRate ?? 0) : 0;
  const jobId = job ? Number(job.Id || job.id) : 0;

  const start = job?.StartTime ? new Date(job.StartTime) : null;
  const end = job?.EndTime ? new Date(job.EndTime) : null;
  const startStr = start ? start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const endStr = end ? end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const handleCheckIn = async () => {
    startShift();
    if (jobId) await api.startJob(jobId).catch(() => {});
    navToWorker('active_shift');
  };

  return (
    <div className="screen-enter flex flex-col gap-4">
      {/* Status */}
      {!arrived ? (
        <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Navigation2 size={22} className="fill-white" />
            </div>
            <div>
              <div className="font-bold">בדרך אל {restaurantName}</div>
              <div className="text-blue-100 text-sm">{restaurantCity}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-white/15 rounded-xl p-3 text-center">
              <div className="text-2xl font-black">{eta}</div>
              <div className="text-blue-100 text-xs">דקות</div>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl p-3 text-center">
              <div className="text-2xl font-black">{(eta * 0.35).toFixed(1)}</div>
              <div className="text-blue-100 text-xs">ק״מ</div>
            </div>
            <div className="flex-1 bg-white/15 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-green-300">₪{hourlyRate}</div>
              <div className="text-blue-100 text-xs">/שעה</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={36} />
            <div>
              <div className="font-black text-xl">הגעת ליעד!</div>
              <div className="text-green-100 text-sm">לחץ צ׳ק-אין להתחיל את המשמרת</div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-64 rounded-2xl overflow-hidden">
        <MapView
          showWorker
          workerName="אני"
          restaurantName={restaurantName}
          mode="navigation"
        />
      </div>

      {/* Job reminder */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-800">פרטי המשמרת</span>
          <span className="text-orange-500 font-black text-lg">₪{hourlyRate}/ש׳</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-xl p-2">
            <div className="font-bold text-gray-800 text-sm">{startStr}</div>
            <div className="text-gray-400 text-xs">התחלה</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2">
            <div className="font-bold text-gray-800 text-sm">{endStr}</div>
            <div className="text-gray-400 text-xs">סיום</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2">
            <div className="font-bold text-green-600 text-sm">מאומת</div>
            <div className="text-gray-400 text-xs">סטטוס</div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">מה לעשות כשמגיע?</h3>
        <div className="space-y-2">
          {[
            'הכנס דרך הכניסה הראשית / אחורית',
            'בקש את המנהל המשמרת',
            'לחץ על צ׳ק-אין באפליקציה',
            'תתחיל לעבוד – בהצלחה! 👨‍🍳',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                arrived && i === 2 ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'
              }`}>
                {i + 1}
              </div>
              <span className="text-gray-700 text-sm leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {arrived && (
        <button
          onClick={handleCheckIn}
          className="w-full bg-green-500 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-green-200 active:scale-98 transition-transform"
        >
          📍 צ׳ק-אין – התחל משמרת
        </button>
      )}

      {!arrived && (
        <button
          onClick={() => navToWorker('home')}
          className="w-full text-center text-gray-400 text-sm py-2"
        >
          ביטול משמרת
        </button>
      )}
    </div>
  );
};
