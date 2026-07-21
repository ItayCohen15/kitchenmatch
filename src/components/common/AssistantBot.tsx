import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import { haptic } from '../../utils/haptics';
import { answerFor, suggestionsFor, type BotRole, type BotCtx } from '../../utils/botKnowledge';

// בוט התמיכה של Staffly ("סטאף") — כפתור צף + חלון צ'אט.
// ⚙️ כרגע **בוט חוקים מקומי** (utils/botKnowledge.ts): אפס עלות, תשובה מיידית, בלי מפתח API.
//    כשיהיה ANTHROPIC_API_KEY בשרת — אפשר להחליף את הקריאה ל-answerFor
//    ב-`await api.assistantChat(next)` (ה-endpoint /assistant/chat כבר קיים ומוכן).

interface Msg { role: 'user' | 'assistant'; content: string }

const GREETING: Record<BotRole, string> = {
  worker:     'היי! אני סטאף 👋 אפשר לשאול אותי על תשלומים, עמלות, משיכת כסף או איך למצוא משמרות.',
  restaurant: 'היי! אני סטאף 👋 אפשר לשאול אותי על פרסום משמרות, עלויות, טעינת ארנק ובחירת עובדים.',
  admin:      'היי! אני סטאף 👋 אפשר לשאול אותי איך המערכת עובדת — עמלות, תשלומים ומדיניות.',
};

// טקסט עשיר קליל: **מודגש** + שורות חדשות
const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {line.split('**').map((part, j) =>
          j % 2 === 1
            ? <strong key={j}>{part}</strong>
            : <React.Fragment key={j}>{part}</React.Fragment>
        )}
      </React.Fragment>
    ))}
  </>
);

export const AssistantBot: React.FC<{ role: BotRole }> = ({ role }) => {
  const { userProfile } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // יתרת הארנק — לתשובות מותאמות אישית ("כמה יש לי?"). best-effort.
  useEffect(() => {
    if (!open || role !== 'worker' || !userProfile?.Id || wallet) return;
    api.getWallet(userProfile.Id).then(setWallet).catch(() => {});
  }, [open, role, userProfile?.Id, wallet]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, thinking, open]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    haptic('light');
    setMessages(m => [...m, { role: 'user', content: q }]);
    setInput('');
    setThinking(true);

    // השהיה קצרה — נותן תחושה טבעית של "מקליד"
    setTimeout(() => {
      const ctx: BotCtx = { role, profile: userProfile, wallet };
      setMessages(m => [...m, { role: 'assistant', content: answerFor(q, ctx) }]);
      setThinking(false);
      haptic('light');
    }, 420);
  };

  const suggestions = suggestionsFor(role);

  return (
    <>
      {/* כפתור צף */}
      {!open && (
        <div className="fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}>
          <div className="w-full max-w-sm flex justify-end">
            <button
              onClick={() => { haptic('light'); setOpen(true); }}
              aria-label="עוזר חכם"
              className="pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow: '0 8px 28px rgba(232,160,32,0.45)' }}>
              <Sparkles size={24} />
            </button>
          </div>
        </div>
      )}

      {/* חלון הצ'אט */}
      {open && (
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{
            background: 'rgba(13,20,32,0.65)', backdropFilter: 'blur(3px)',
            paddingTop: 'max(env(safe-area-inset-top), 16px)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          }}>
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
            style={{ height: 'min(600px, 88dvh)' }}>

            {/* כותרת */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg,#0d1420,#1a2744)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-black text-sm">סטאף · עוזר</div>
                  <div className="text-[11px]" style={{ color: '#8899bb' }}>כאן לענות על כל שאלה</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 active:bg-white/20 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* הודעות */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-gray-50"
              style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* ברכה */}
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed bg-white text-gray-800 border border-gray-100">
                  {GREETING[role]}
                </div>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-500 text-white rounded-bl-md'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-br-md'
                  }`}>
                    <RichText text={m.content} />
                  </div>
                </div>
              ))}

              {thinking && (
                <div className="flex justify-end">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-br-md px-4 py-3 flex items-center gap-1.5">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* שאלות מוצעות — תמיד זמינות, מתעדכנות אחרי תשובה */}
              {!thinking && (
                <div className="flex flex-wrap gap-2 justify-end pt-1">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => ask(s)}
                      className="text-xs font-semibold rounded-full px-3 py-1.5 border transition-transform active:scale-95"
                      style={{ background: 'rgba(232,160,32,0.08)', borderColor: 'rgba(232,160,32,0.3)', color: '#b8791a' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* שליחה */}
            <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') ask(input); }}
                  enterKeyHint="send"
                  placeholder="שאל אותי כל דבר..."
                  className="flex-1 border border-gray-200 bg-gray-50 rounded-2xl px-4 py-2.5 text-sm text-right outline-none focus:border-amber-400 focus:bg-white"
                />
                <button onClick={() => ask(input)} disabled={thinking || !input.trim()}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0 active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                  <Send size={17} style={{ transform: 'scaleX(-1)' }} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                מידע על מס הוא הערכה בלבד · לשאלות נוספות support@staffly.com
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
