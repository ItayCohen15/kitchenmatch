import React, { useState, useEffect } from 'react';
import { MessageCircle, GraduationCap, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api, chatSeen } from '../../api';
import { ChatModal } from './ChatModal';

// תצוגת זמן: היום → שעה, אחרת תאריך קצר
const fmtWhen = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toDateString() === new Date().toDateString()
    ? dt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : dt.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
};

export const ChatsScreen: React.FC<{ role: 'restaurant' | 'worker' }> = ({ role }) => {
  const { userProfile } = useApp();
  const pid = userProfile?.Id;
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openThread, setOpenThread] = useState<any | null>(null);

  const load = () => {
    if (!pid) return;
    api.getThreads(role, pid)
      .then((d: any) => setThreads(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [pid]);
  useEffect(() => { if (!pid) return; const iv = setInterval(load, 6000); return () => clearInterval(iv); }, [pid]);

  // נפתח מהתראת push / באנר בבית — פתח את השיחה המבוקשת.
  // תלוי ב-threads (מתעדכן בכל פולינג) כדי שייפתח גם אם מספר השרשורים לא השתנה.
  useEffect(() => {
    try {
      const want = localStorage.getItem('km_open_chat');
      if (want && threads.length) {
        const t = threads.find(x => String(x.JobId) === String(want));
        if (t) { setOpenThread(t); localStorage.removeItem('km_open_chat'); }
      }
    } catch {}
  }, [threads]);

  return (
    <div className="screen-enter space-y-4">
      {/* כותרת */}
      <div className="rounded-3xl p-4 text-white flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #0d1420 0%, #1a2744 100%)' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(232,160,32,0.18)', border: '1px solid rgba(232,160,32,0.3)' }}>
          <MessageCircle className="text-amber-400" size={22} />
        </div>
        <div>
          <div className="font-black text-lg leading-tight">הצ'אטים שלי</div>
          <div className="text-xs" style={{ color: '#8899bb' }}>
            {role === 'restaurant' ? 'שיחות עם העובדים שלך' : 'שיחות עם מסעדות'}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!loading && threads.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl card-shadow">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-gray-500 font-medium text-sm">אין עדיין שיחות</p>
          <p className="text-gray-400 text-xs mt-0.5">צ'אט נפתח אוטומטית עם כל משמרת או סטאז'</p>
        </div>
      )}

      <div className="space-y-2">
        {threads.map(t => {
          const unread = chatSeen.isUnread(Number(t.JobId), t.LastMsgId, t.LastSenderRole, role);
          const mine = t.LastSenderRole === role;
          const initials = (t.Name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2);
          const locked = !t.CanSend;
          return (
            <button key={t.JobId} onClick={() => setOpenThread(t)}
              className="w-full bg-white rounded-2xl p-3.5 card-shadow flex items-center gap-3 text-right active:scale-[0.99] transition-transform">
              {/* אווטאר */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
                  {initials}
                </div>
                {unread && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />}
              </div>
              {/* תוכן */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm truncate ${unread ? 'font-black text-gray-900' : 'font-bold text-gray-800'}`}>{t.Name}</span>
                  {t.JobType === 'stage' && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5 flex-shrink-0">
                      <GraduationCap size={10} /> סטאז'
                    </span>
                  )}
                  {locked && <Lock size={11} className="text-gray-300 flex-shrink-0" />}
                </div>
                <div className={`text-xs truncate mt-0.5 ${unread ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                  {t.LastText ? `${mine ? 'אתה: ' : ''}${t.LastText}` : 'אין הודעות עדיין — תגיד שלום 👋'}
                </div>
              </div>
              {/* זמן */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[11px] ${unread ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>{fmtWhen(t.LastAt)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {openThread && (
        <ChatModal
          jobId={Number(openThread.JobId)}
          title={openThread.Name || ''}
          myRole={role}
          myName={userProfile?.Name || ''}
          readOnly={!openThread.CanSend}
          onClose={() => { setOpenThread(null); load(); }}
        />
      )}
    </div>
  );
};

// ── באנר "הודעה חדשה" לדף הבית ──
export const UnreadChatBanner: React.FC<{ role: 'restaurant' | 'worker'; onOpen: (jobId: number) => void }> = ({ role, onOpen }) => {
  const { userProfile } = useApp();
  const pid = userProfile?.Id;
  const [unreadThread, setUnreadThread] = useState<any | null>(null);

  useEffect(() => {
    if (!pid) return;
    const check = () => api.getThreads(role, pid)
      .then((d: any) => {
        const list = Array.isArray(d) ? d : [];
        const ur = list.find(t => chatSeen.isUnread(Number(t.JobId), t.LastMsgId, t.LastSenderRole, role));
        setUnreadThread(ur || null);
      })
      .catch(() => {});
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [pid, role]);

  if (!unreadThread) return null;
  const isStage = unreadThread.JobType === 'stage';
  const text = role === 'worker'
    ? `${unreadThread.Name}${isStage ? " — המסעדה שאתה מבצע בה סטאז'" : ''} שלחה לך הודעה חדשה`
    : `${unreadThread.Name}${isStage ? " — העובד שמבצע אצלך סטאז'" : ''} שלח לך הודעה חדשה`;

  return (
    <button onClick={() => onOpen(Number(unreadThread.JobId))}
      className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-right active:scale-[0.98] transition-transform"
      style={{ background: 'linear-gradient(135deg,#1a2744,#0f2444)', border: '1px solid rgba(232,160,32,0.35)' }}>
      <div className="relative flex-shrink-0">
        <MessageCircle size={22} className="text-amber-400" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-white text-sm">💬 {text}</div>
        <div className="text-white/55 text-xs">לחץ לפתיחת הצ'אט</div>
      </div>
    </button>
  );
};
