import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Lock } from 'lucide-react';
import { api, chatSeen } from '../../api';

interface Props {
  jobId: number;            // שרשור ההודעות (לסטאז' — מזהה הסטאז')
  title: string;            // שם הצד השני
  myRole: 'restaurant' | 'worker';
  myName: string;
  readOnly?: boolean;       // צ'אט נעול — לקריאה בלבד
  onClose: () => void;
}

export const ChatModal: React.FC<Props> = ({ jobId, title, myRole, myName, readOnly, onClose }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => api.getMessages(jobId)
    .then((d: any) => {
      const list = Array.isArray(d) ? d : [];
      setMessages(list);
      // סמן כנקרא — ההודעה האחרונה שראינו
      const last = list[list.length - 1];
      if (last?.Id) chatSeen.mark(jobId, Number(last.Id));
    })
    .catch(() => {});
  useEffect(() => { load(); const iv = setInterval(load, 4000); return () => clearInterval(iv); }, [jobId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true); setSendErr('');
    try { await api.sendMessage(jobId, t, myName, myRole); setText(''); await load(); }
    catch (e: any) { setSendErr(e.message || 'שליחה נכשלה'); }
    setSending(false);
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(13,20,32,0.65)', backdropFilter: 'blur(3px)', paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden" style={{ height: 'min(560px, 85dvh)' }}>
        {/* כותרת */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm">
              {(title || 'צ').slice(0, 2)}
            </div>
            <div>
              <div className="font-black text-gray-900 text-sm">{title}</div>
              <div className="text-gray-400 text-[11px] flex items-center gap-1"><MessageCircle size={10} /> צ'אט סטאז'</div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 transition-colors"><X size={18} /></button>
        </div>

        {/* הודעות */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50" style={{ WebkitOverflowScrolling: 'touch' }}>
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm pt-10">
              <MessageCircle size={26} className="text-gray-300 mx-auto mb-2" />
              עדיין אין הודעות. אפשר לפתוח בשלום.
            </div>
          )}
          {messages.map((m: any) => {
            const own = m.SenderRole === myRole;
            return (
              <div key={m.Id} className={`flex ${own ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                  own ? 'bg-amber-500 text-white rounded-bl-md' : 'bg-white text-gray-800 border border-gray-100 rounded-br-md'
                }`}>
                  <div>{m.Text}</div>
                  <div className={`text-[10px] mt-0.5 ${own ? 'text-white/70' : 'text-gray-400'}`}>{m.DisplayTime}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* שליחה / נעול */}
        {readOnly ? (
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50 text-center">
            <span className="text-gray-500 text-xs font-semibold flex items-center justify-center gap-1.5">
              <Lock size={12} /> הצ'אט לקריאה בלבד — ייפתח שוב כשתתאמו משמרת חדשה
            </span>
          </div>
        ) : (
          <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 bg-white">
            {sendErr && <div className="text-red-500 text-xs text-center mb-1.5">{sendErr}</div>}
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="כתוב הודעה..."
                className="flex-1 border border-gray-200 bg-gray-50 rounded-2xl px-4 py-2.5 text-sm text-right outline-none focus:border-amber-400 focus:bg-white"
              />
              <button onClick={send} disabled={sending || !text.trim()}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                <Send size={17} style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
