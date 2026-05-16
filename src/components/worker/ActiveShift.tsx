import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

export const WorkerActiveShift: React.FC = () => {
  const { navToWorker, chatMessages, sendMessage, shiftStartTime, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [ended, setEnded] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const startTime = shiftStartTime || new Date(Date.now() - 30 * 60000);
  const hourlyRate = job?.HourlyRate || job?.hourlyRate || 0;
  const restaurantName = job?.RestaurantName || job?.restaurantName || 'המסעדה';
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

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const grossEarned = ((elapsed / 3600) * hourlyRate).toFixed(2);
  const netEarned   = ((elapsed / 3600) * hourlyRate * 0.935).toFixed(2);

  const QUICK = ['בדרך!', 'מוכן 👍', 'צריך עוד חומרים', '5 דקות ועוד'];

  const handleEndShift = async () => {
    setEnding(true);
    try {
      if (jobId) await api.workerEndShift(jobId);
      setEnded(true);
    } catch {
      setEnded(true);
    }
  };

  if (ended) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">⏳</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">ממתין לאישור</h2>
        <p className="text-gray-500 leading-relaxed">
          שלחנו בקשת סיום למסעדה.
          <br />
          ברגע שיאשרו — התשלום יועבר לארנק שלך 💰
        </p>
        <div className="bg-green-50 rounded-2xl p-4 w-full text-center">
          <div className="text-2xl font-black text-green-600">₪{netEarned}</div>
          <div className="text-gray-400 text-sm">עתיד להתקבל (נטו לאחר 6.5%)</div>
        </div>
        <button
          onClick={() => navToWorker('home')}
          className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold"
        >
          חזור לדף הבית
        </button>
      </div>
    );
  }

  return (
    <div className="screen-enter flex flex-col gap-3">
      {/* Live earnings banner */}
      <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-sm">משמרת פעילה</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1">
            <Clock size={14} />
            <span className="font-black text-lg tracking-widest">{fmt(elapsed)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-green-100 text-xs">הרוויח עד כה (נטו)</div>
            <div className="text-3xl font-black">₪{netEarned}</div>
            <div className="text-green-200 text-xs">ברוטו: ₪{grossEarned}</div>
          </div>
          <div className="text-right">
            <div className="text-green-100 text-xs">מסעדה</div>
            <div className="font-bold">{restaurantName}</div>
            <div className="text-green-100 text-sm">₪{hourlyRate}/ש׳</div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl card-shadow flex flex-col" style={{ height: 280 }}>
        <div className="flex items-center justify-between p-3 border-b border-gray-50">
          <span className="font-bold text-gray-800 text-sm">צ׳אט עם {restaurantName}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${!msg.isOwn ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                !msg.isOwn ? 'bg-gray-100 text-gray-800 rounded-tr-sm' : 'bg-green-500 text-white rounded-tl-sm'
              }`}>
                <div>{msg.text}</div>
                <div className={`text-xs mt-0.5 ${!msg.isOwn ? 'text-gray-400' : 'text-green-100'}`}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
          {QUICK.map(m => (
            <button key={m} onClick={() => sendMessage(m, false)}
              className="flex-shrink-0 text-xs bg-green-50 text-green-600 rounded-full px-3 py-1.5 font-medium whitespace-nowrap">
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 border-t border-gray-50">
          <div className="flex-1 bg-gray-50 rounded-xl flex items-center pr-3">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { sendMessage(input.trim(), false); setInput(''); } }}
              placeholder="כתוב הודעה..."
              className="flex-1 bg-transparent py-2.5 text-sm text-right outline-none" />
          </div>
          <button onClick={() => { if (input.trim()) { sendMessage(input.trim(), false); setInput(''); } }}
            className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-white">
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* End shift */}
      {!confirmEnd ? (
        <button
          onClick={() => setConfirmEnd(true)}
          className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-lg"
        >
          🏁 סיים משמרת
        </button>
      ) : (
        <div className="bg-white rounded-2xl p-4 card-shadow screen-enter space-y-3">
          <h3 className="font-bold text-gray-900 text-center">בטוח שתרצה לסיים?</h3>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-green-600">₪{netEarned} נטו</div>
            <div className="text-gray-400 text-xs">תועבר לארנק לאחר אישור המסעדה</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setConfirmEnd(false)}
              className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-semibold">
              המשך לעבוד
            </button>
            <button onClick={handleEndShift} disabled={ending}
              className="flex-1 bg-green-500 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2">
              {ending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={16} /> סיים</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
