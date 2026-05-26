import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { api } from '../../api';

interface Props {
  jobId: number;
  myRole: 'restaurant' | 'worker';
  myName: string;
}

export const Chat: React.FC<Props> = ({ jobId, myRole, myName }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jobId) return;
    const load = () => {
      api.getMessages(jobId)
        .then(data => { if (Array.isArray(data)) setMessages(data); })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 2000);
    return () => clearInterval(iv);
  }, [jobId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    setInput('');
    try {
      await api.sendMessage(jobId, text, myName, myRole);
      setMessages(prev => [...prev, {
        Id: Date.now(),
        SenderRole: myRole,
        SenderName: myName,
        Text: text,
        CreatedAt: new Date().toISOString(),
      }]);
    } catch (e: any) {
      setError('שגיאה בשליחה');
      setInput(text);
    }
    setSending(false);
  };

  const isMe = (msg: any) => msg.SenderRole === myRole;

  return (
    <div className="bg-white rounded-2xl card-shadow flex flex-col" style={{ height: 280 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <span className="font-bold text-gray-800 text-sm">💬 צ׳אט</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-red-500 text-xs">{error}</span>}
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* הודעות */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-300 text-sm py-8">אין הודעות עדיין — שלח הודעה ראשונה!</div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.Id || i} className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
              isMe(msg)
                ? 'bg-orange-500 text-white rounded-bl-sm'
                : 'bg-gray-100 text-gray-800 rounded-br-sm'
            }`}>
              {!isMe(msg) && (
                <div className="text-xs font-bold mb-0.5 opacity-60">{msg.SenderName}</div>
              )}
              <div>{msg.Text}</div>
              <div className={`text-xs mt-0.5 ${isMe(msg) ? 'text-orange-200' : 'text-gray-400'}`}>
                {new Date(msg.CreatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* שליחה */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 flex-shrink-0 bg-white">
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Send size={15} className="text-white" />}
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="כתוב הודעה..."
          className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-right outline-none border border-gray-100 focus:border-orange-300"
          style={{ fontSize: '16px' }}
        />
      </div>
    </div>
  );
};
