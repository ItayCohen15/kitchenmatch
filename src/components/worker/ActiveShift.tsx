import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NEARBY_JOBS } from '../../data/mockData';

export const WorkerActiveShift: React.FC = () => {
  const { navToWorker, chatMessages, sendMessage, shiftStartTime, getSelectedJob } = useApp();
  const job = getSelectedJob() || NEARBY_JOBS[0];
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const startTime = shiftStartTime || new Date(Date.now() - 55 * 60000);

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
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const earned = ((elapsed / 3600) * job.hourlyRate * 0.9).toFixed(2);

  const QUICK = ['בדרך!', 'מוכן 👍', 'צריך עוד חומרים', '5 דקות ועוד'];

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
            <div className="text-green-100 text-xs">הרוויח עד כה</div>
            <div className="text-3xl font-black">₪{earned}</div>
          </div>
          <div className="text-right">
            <div className="text-green-100 text-xs">מסעדה</div>
            <div className="font-bold">{job.restaurantName}</div>
            <div className="text-green-100 text-sm">₪{job.hourlyRate}/ש׳</div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl card-shadow flex flex-col" style={{ height: 300 }}>
        <div className="flex items-center justify-between p-3 border-b border-gray-50">
          <span className="font-bold text-gray-800 text-sm">צ׳אט עם {job.restaurantName}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-3 space-y-2"
        >
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${!msg.isOwn ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  !msg.isOwn
                    ? 'bg-gray-100 text-gray-800 rounded-tr-sm'
                    : 'bg-green-500 text-white rounded-tl-sm'
                }`}
              >
                <div>{msg.text}</div>
                <div className={`text-xs mt-0.5 ${!msg.isOwn ? 'text-gray-400' : 'text-green-100'}`}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
          {QUICK.map(m => (
            <button
              key={m}
              onClick={() => sendMessage(m, false)}
              className="flex-shrink-0 text-xs bg-green-50 text-green-600 rounded-full px-3 py-1.5 font-medium whitespace-nowrap"
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 border-t border-gray-50">
          <div className="flex-1 bg-gray-50 rounded-xl flex items-center pr-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && input.trim()) {
                  sendMessage(input.trim(), false);
                  setInput('');
                }
              }}
              placeholder="כתוב הודעה..."
              className="flex-1 bg-transparent py-2.5 text-sm text-right outline-none"
            />
          </div>
          <button
            onClick={() => { if (input.trim()) { sendMessage(input.trim(), false); setInput(''); } }}
            className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-white"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* End shift */}
      <button
        onClick={() => navToWorker('end_shift')}
        className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform"
      >
        סיים משמרת וגבה תשלום
      </button>

      <div className="text-center text-xs text-gray-400">
        שעת סיום מתוכננת: {job.endTime}
      </div>
    </div>
  );
};
