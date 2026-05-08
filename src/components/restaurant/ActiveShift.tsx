import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WORKERS } from '../../data/mockData';

export const ActiveShift: React.FC = () => {
  const { navToRestaurant, chatMessages, sendMessage, shiftStartTime } = useApp();
  const worker = WORKERS[0];
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const startTime = shiftStartTime || new Date(Date.now() - 42 * 60000);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const earnedSoFar = ((elapsed / 3600) * worker.hourlyRate).toFixed(2);

  const QUICK_MESSAGES = ['תודה!', 'אנחנו עמוסים', 'צריך עוד 30 דקות?', 'עשה טוב 👍'];

  return (
    <div className="screen-enter flex flex-col h-full gap-3">
      {/* Active shift banner */}
      <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-sm">משמרת פעילה</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1">
            <Clock size={14} />
            <span className="font-black text-lg tracking-widest">{formatElapsed(elapsed)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black"
            style={{ backgroundColor: worker.avatarColor }}
          >
            {worker.initials}
          </div>
          <div className="flex-1">
            <div className="font-bold">{worker.name} · שף</div>
            <div className="text-green-100 text-sm">₪{worker.hourlyRate}/ש׳ · הגיע 18:02</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-green-100">הרוויח עד כה</div>
            <div className="font-black text-xl">₪{earnedSoFar}</div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl card-shadow flex flex-col" style={{ height: 320 }}>
        <div className="flex items-center justify-between p-3 border-b border-gray-50">
          <span className="font-bold text-gray-800 text-sm">צ׳אט עם {worker.name}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-3 space-y-2"
        >
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  msg.isOwn
                    ? 'bg-gray-100 text-gray-800 rounded-tr-sm'
                    : 'bg-orange-500 text-white rounded-tl-sm'
                }`}
              >
                <div>{msg.text}</div>
                <div className={`text-xs mt-0.5 ${msg.isOwn ? 'text-gray-400' : 'text-orange-100'}`}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick replies */}
        <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
          {QUICK_MESSAGES.map(m => (
            <button
              key={m}
              onClick={() => sendMessage(m, true)}
              className="flex-shrink-0 text-xs bg-orange-50 text-orange-600 rounded-full px-3 py-1.5 font-medium whitespace-nowrap"
            >
              {m}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 p-3 border-t border-gray-50">
          <div className="flex-1 bg-gray-50 rounded-xl flex items-center pr-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && input.trim()) {
                  sendMessage(input.trim(), true);
                  setInput('');
                }
              }}
              placeholder="כתוב הודעה..."
              className="flex-1 bg-transparent py-2.5 text-sm text-right outline-none"
            />
          </div>
          <button
            onClick={() => {
              if (input.trim()) {
                sendMessage(input.trim(), true);
                setInput('');
              }
            }}
            className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Report issue */}
      {showReport ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <h3 className="font-bold text-red-800 mb-3">דיווח על בעיה</h3>
          <div className="space-y-2">
            {['לא הגיע בזמן', 'אינו מקצועי', 'בעיית ניקיון', 'עוזב מוקדם', 'אחר'].map(issue => (
              <button
                key={issue}
                onClick={() => setShowReport(false)}
                className="w-full text-right py-2.5 px-3 bg-white rounded-xl text-red-700 text-sm font-medium border border-red-100"
              >
                {issue}
              </button>
            ))}
          </div>
          <button onClick={() => setShowReport(false)} className="mt-2 text-gray-500 text-sm w-full text-center">ביטול</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl py-3 font-semibold text-sm"
          >
            <AlertTriangle size={16} />
            דיווח בעיה
          </button>
          <button
            onClick={() => navToRestaurant('end_shift')}
            className="bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm active:scale-95 transition-transform"
          >
            סיים משמרת
          </button>
        </div>
      )}
    </div>
  );
};
