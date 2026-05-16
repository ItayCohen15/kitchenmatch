import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

export const ActiveShift: React.FC = () => {
  const { navToRestaurant, chatMessages, sendMessage, shiftStartTime, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pendingShifts, setPendingShifts] = useState<any[]>([]);
  const [showReport, setShowReport] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const startTime = shiftStartTime || new Date(Date.now() - 42 * 60000);
  const hourlyRate = job?.HourlyRate || job?.hourlyRate || 0;
  const workerName = job?.WorkerName || 'העובד';
  const jobId = job?.Id || job?.id;

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  // בדוק כל 10 שניות אם יש משמרות הממתינות לאישור סיום
  useEffect(() => {
    if (!userProfile?.Id) return;
    const check = () => {
      api.getShiftsToConfirm(userProfile.Id)
        .then(data => setPendingShifts(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [userProfile]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const baseAmount = (elapsed / 3600) * hourlyRate;
  const restaurantPays = (baseAmount * 1.065).toFixed(2);

  const QUICK = ['תודה!', 'אנחנו עמוסים', 'צריך עוד 30 דקות?', 'עשה טוב 👍'];

  const handleConfirmEnd = async (shiftJobId: number) => {
    setConfirming(true);
    try {
      await api.completeJob(shiftJobId);
      setConfirmed(true);
      setTimeout(() => navToRestaurant('end_shift'), 1500);
    } catch {
      setConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">✅</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">משמרת אושרה!</h2>
        <p className="text-gray-500">התשלום עובר לעובד · ממשיך לדירוג...</p>
      </div>
    );
  }

  return (
    <div className="screen-enter flex flex-col gap-3">
      {/* התראה על משמרות הממתינות לאישור */}
      {pendingShifts.map(shift => (
        <div key={shift.Id} className="bg-gradient-to-l from-yellow-500 to-amber-400 rounded-2xl p-4 text-white screen-enter">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="fill-white" />
            <span className="font-bold">{shift.WorkerName} ביקש לסיים משמרת</span>
          </div>
          <div className="bg-white/20 rounded-xl p-3 mb-3 text-center">
            <div className="text-sm text-yellow-100">תשלם לאחר אישור</div>
            <div className="text-2xl font-black">
              ₪{((new Date(shift.EndTime).getTime() - new Date(shift.StartTime).getTime()) / (1000 * 60 * 60) * shift.HourlyRate * 1.065).toFixed(0)}
            </div>
            <div className="text-yellow-100 text-xs">(כולל 6.5% עמלה)</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => api.cancelJob(shift.Id).then(() => setPendingShifts(p => p.filter(s => s.Id !== shift.Id)))}
              className="flex-shrink-0 bg-white/20 rounded-xl px-4 py-2.5 font-semibold text-sm"
            >
              דחה
            </button>
            <button
              onClick={() => handleConfirmEnd(shift.Id)}
              disabled={confirming}
              className="flex-1 bg-white text-amber-600 rounded-xl py-2.5 font-black flex items-center justify-center gap-2"
            >
              {confirming
                ? <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                : <><CheckCircle2 size={16} /> אשר סיום ושלח תשלום</>
              }
            </button>
          </div>
        </div>
      ))}

      {/* Active shift banner */}
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
            {workerName.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
          </div>
          <div className="flex-1">
            <div className="font-bold">{workerName}</div>
            <div className="text-green-100 text-sm">₪{hourlyRate}/ש׳</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-green-100">תשלם עד כה</div>
            <div className="font-black text-xl">₪{restaurantPays}</div>
            <div className="text-green-200 text-xs">(+6.5% עמלה)</div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl card-shadow flex flex-col" style={{ height: 280 }}>
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
                <div>{msg.text}</div>
                <div className={`text-xs mt-0.5 ${msg.isOwn ? 'text-orange-100' : 'text-gray-400'}`}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
          {QUICK.map(m => (
            <button key={m} onClick={() => sendMessage(m, true)}
              className="flex-shrink-0 text-xs bg-orange-50 text-orange-600 rounded-full px-3 py-1.5 font-medium whitespace-nowrap">
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 border-t border-gray-50">
          <div className="flex-1 bg-gray-50 rounded-xl flex items-center pr-3">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { sendMessage(input.trim(), true); setInput(''); } }}
              placeholder="כתוב הודעה..."
              className="flex-1 bg-transparent py-2.5 text-sm text-right outline-none" />
          </div>
          <button onClick={() => { if (input.trim()) { sendMessage(input.trim(), true); setInput(''); } }}
            className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white">
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Report issue */}
      <button onClick={() => setShowReport(s => !s)}
        className="w-full bg-gray-100 text-gray-600 rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2">
        <AlertTriangle size={16} />
        דיווח על בעיה
      </button>

      {showReport && (
        <div className="bg-white rounded-2xl p-4 card-shadow screen-enter">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">מה הבעיה?</h3>
          {['העובד לא הגיע', 'העובד לא מתאים', 'בעיית תקשורת', 'אחר'].map(r => (
            <button key={r} onClick={() => { setShowReport(false); }}
              className="w-full text-right py-2.5 px-3 mb-2 bg-gray-50 rounded-xl text-gray-700 text-sm">
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
