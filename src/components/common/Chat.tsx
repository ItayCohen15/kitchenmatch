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
  const bottomRef = useRef<HTMLDivElement>(null);

  // טעינת הודעות + פולינג כל 2 שניות
  useEffect(() => {
    if (!jobId) return;
    const load = () => {
      api.getMessages(jobId)
        .then(data => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 2000);
    return () => clearInterval(iv);
  }, [jobId]);

  // גלול למטה כשיש הודעה חדשה
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      await api.sendMessage(jobId, text, myName, myRole);
      // הוסף מקומית מיד
      setMessages(prev => [...prev, {
        Id: Date.now(),
        SenderRole: myRole,
        SenderName: myName,
        Text: text,
        CreatedAt: new Date().toISOString(),
      }]);
    } catch {}
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMe = (msg: any) => msg.SenderRole === myRole;

  return (
    <div className="bg-white rounded-2xl card-shadow flex flex-col overflow-hidden" style={{ height: 260 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <span className="font-bold text-gray-800 text-sm">💬 צ׳אט</span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>

      {/* הודעות */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-300 text-sm py-6">אין הודעות עדיין</div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.Id || i} className={`flex ${isMe(msg) ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
              isMe(msg)
                ? 'bg-orange-500 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              {!isMe(msg) && (
                <div className="text-xs font-bold mb-0.5 opacity-70">{msg.SenderName}</div>
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
      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 flex-shrink-0">
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <Send size={16} className="text-white" />
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="כתוב הודעה..."
          className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm text-right outline-none border border-gray-100 focus:border-orange-300"
        />
      </div>
    </div>
  );
};
