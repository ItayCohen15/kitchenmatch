import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

export const ActiveShift: React.FC = () => {
  const { navToRestaurant, chatMessages, sendMessage, shiftStartTime, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [workerConfirmed, setWorkerConfirmed] = useState(false);
  const [restaurantConfirmed, setRestaurantConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [bothDone, setBothDone] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const startTime = shiftStartTime || new Date(Date.now() - 42 * 60000);
  const hourlyRate: number = job ? Number(job.HourlyRate ?? job.hourlyRate ?? 0) : 0;
  const workerName: string = job?.WorkerName || 'העובד';
  const workerInit = workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const jobId: number = job ? Number(job.Id ?? job.id ?? 0) : 0;

  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  // בדוק סטטוס אישורים כל 8 שניות
  useEffect(() => {
    if (!jobId) return;
    const check = async () => {
      try {
        const status = await api.getEndStatus(jobId);
        setWorkerConfirmed(Boolean(status.WorkerConfirmedEnd));
        setRestaurantConfirmed(Boolean(status.RestaurantConfirmedEnd));
        if (status.Status === 'pending_completion') setBothDone(true);
      } catch {}
    };
    check();
    const iv = setInterval(check, 8000);
    return () => clearInterval(iv);
  }, [jobId]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const baseAmount = (elapsed / 3600) * hourlyRate;
  const totalWithFee = (baseAmount * 1.065).toFixed(2);
  const QUICK = ['תודה!', 'אנחנו עמוסים', 'צריך עוד 30 דקות?', 'עשה טוב 👍'];

  const handleConfirmEnd = async () => {
    setConfirming(true);
    try {
      const res = await api.restaurantEndShift(jobId);
      setRestaurantConfirmed(true);
      if (res.bothConfirmed) setBothDone(true);
    } catch {}
    setConfirming(false);
    setShowConfirmDialog(false);
  };

  // כאשר שני הצדדים אישרו — השלם תשלום
  useEffect(() => {
    if (!bothDone || !jobId) return;
    api.completeJob(jobId).catch(() => {});
  }, [bothDone, jobId]);

  if (bothDone) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">🎉</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">שני הצדדים אישרו!</h2>
        <p className="text-gray-500">התשלום עובר לעובד כעת 💰</p>
        <div className="bg-orange-50 rounded-2xl p-4 w-full text-center">
          <div className="text-3xl font-black text-orange-600">₪{totalWithFee}</div>
          <div className="text-gray-400 text-sm mt-1">סה״כ חויב (כולל 6.5% עמלה)</div>
        </div>
        <button onClick={() => navToRestaurant('end_shift')}
          className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-lg">
          דרג את {workerName} →
        </button>
      </div>
    );
  }

  return (
    <div className="screen-enter flex flex-col gap-3">
      {/* Live banner */}
      <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-sm">משמרת פעילה</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1">
            <Clock size={14} />
            <span className="font-black text-lg tracking-widest">{fmt(elapsed)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black">
            {workerInit}
          </div>
          <div className="flex-1">
            <div className="font-bold">{workerName}</div>
            <div className="text-green-100 text-sm">₪{hourlyRate}/ש׳</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-green-100">תשלם עד כה</div>
            <div className="font-black text-xl">₪{totalWithFee}</div>
            <div className="text-green-200 text-xs">+6.5% עמלה</div>
          </div>
        </div>
      </div>

      {/* סטטוס אישורים */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">אישורי סיום משמרת</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'אתה (מסעדה)', confirmed: restaurantConfirmed },
            { label: workerName,    confirmed: workerConfirmed },
          ].map(side => (
            <div key={side.label} className={`rounded-xl p-3 text-center border-2 transition-all ${
              side.confirmed ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="text-2xl mb-1">{side.confirmed ? '✅' : '⏳'}</div>
              <div className={`text-xs font-bold truncate ${side.confirmed ? 'text-green-600' : 'text-gray-400'}`}>
                {side.label}
              </div>
              <div className={`text-xs ${side.confirmed ? 'text-green-500' : 'text-gray-400'}`}>
                {side.confirmed ? 'אישר' : 'ממתין'}
              </div>
            </div>
          ))}
        </div>
        {!restaurantConfirmed && workerConfirmed && (
          <p className="text-center text-xs text-blue-700 mt-2 bg-blue-50 rounded-lg p-2 font-semibold">
            💡 {workerName} כבר אישר סיום! אשר גם אתה לשחרר תשלום.
          </p>
        )}
        {restaurantConfirmed && !workerConfirmed && (
          <p className="text-center text-xs text-amber-700 mt-2 bg-amber-50 rounded-lg p-2">
            ⏳ ממתין לאישור {workerName}...
          </p>
        )}
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl card-shadow flex flex-col" style={{ height: 230 }}>
        <div className="flex items-center justify-between p-3 border-b border-gray-50">
          <span className="font-bold text-gray-800 text-sm">צ׳אט עם {workerName}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                msg.isOwn ? 'bg-orange-500 text-white rounded-tl-sm' : 'bg-gray-100 text-gray-800 rounded-tr-sm'
              }`}>
                {msg.text}
                <div className={`text-xs mt-0.5 ${msg.isOwn ? 'text-orange-100' : 'text-gray-400'}`}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-1 flex gap-1 overflow-x-auto">
          {QUICK.map(m => (
            <button key={m} onClick={() => sendMessage(m, true)}
              className="flex-shrink-0 text-xs bg-orange-50 text-orange-600 rounded-full px-2.5 py-1 font-medium whitespace-nowrap">
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 border-t border-gray-50">
          <div className="flex-1 bg-gray-50 rounded-xl flex items-center pr-3">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { sendMessage(input.trim(), true); setInput(''); } }}
              placeholder="כתוב הודעה..." className="flex-1 bg-transparent py-2 text-sm text-right outline-none" />
          </div>
          <button onClick={() => { if (input.trim()) { sendMessage(input.trim(), true); setInput(''); } }}
            className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white">
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* כפתור סיום */}
      {!restaurantConfirmed ? (
        !showConfirmDialog ? (
          <button onClick={() => setShowConfirmDialog(true)}
            className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform">
            🏁 סיים משמרת
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-4 card-shadow space-y-3 screen-enter">
            <h3 className="font-bold text-gray-900 text-center">בטוח שתרצה לסיים?</h3>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <div className="text-xl font-black text-orange-600">₪{totalWithFee}</div>
              <div className="text-gray-400 text-xs">יחויב לאחר אישור שני הצדדים</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-semibold">
                המשך משמרת
              </button>
              <button onClick={handleConfirmEnd} disabled={confirming}
                className="flex-1 bg-orange-500 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2">
                {confirming
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle2 size={16} /> אשר סיום</>}
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <CheckCircle2 size={22} className="text-green-500 mx-auto mb-1" />
          <p className="font-bold text-green-700 text-sm">אישרת סיום ✅</p>
          <p className="text-green-600 text-xs mt-0.5">ממתין לאישור {workerName}</p>
        </div>
      )}

      {/* Report */}
      <button onClick={() => setShowReport(s => !s)}
        className="w-full bg-gray-100 text-gray-500 rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2">
        <AlertTriangle size={16} />
        דיווח על בעיה
      </button>
      {showReport && (
        <div className="bg-white rounded-2xl p-4 card-shadow screen-enter">
          {['העובד לא הגיע', 'העובד לא מתאים', 'בעיית תקשורת', 'אחר'].map(r => (
            <button key={r} onClick={() => setShowReport(false)}
              className="w-full text-right py-2.5 px-3 mb-2 bg-gray-50 rounded-xl text-gray-700 text-sm">
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
