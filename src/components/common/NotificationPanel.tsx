import React, { useEffect, useState } from 'react';
import { X, Bell, CheckCheck } from 'lucide-react';
import { api } from '../../api';

interface Props {
  onClose: () => void;
}

export const NotificationPanel: React.FC<Props> = ({ onClose }) => {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications()
      .then(data => setNotifs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleReadAll = async () => {
    await api.markNotificationsRead().catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, IsRead: true })));
  };

  const unread = notifs.filter(n => !n.IsRead).length;

  const timeLabel = (min: number) => {
    if (min < 1)  return 'עכשיו';
    if (min < 60) return `לפני ${min} דק׳`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `לפני ${h} ש׳`;
    return `לפני ${Math.floor(h/24)} ימים`;
  };

  const iconFor = (title: string) => {
    if (title.includes('מועמדות')) return '📨';
    if (title.includes('אושר') || title.includes('אישור')) return '✅';
    if (title.includes('הגיע') || title.includes('צ׳ק')) return '📍';
    if (title.includes('הודעה') || title.includes('צ׳אט')) return '💬';
    if (title.includes('סיים') || title.includes('סיום')) return '🏁';
    if (title.includes('חירום')) return '🚨';
    return '🔔';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-sm mx-auto"
        style={{ animation: 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="bg-white rounded-b-3xl shadow-2xl overflow-hidden"
          style={{ maxHeight: '80dvh' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4"
            style={{ background: 'linear-gradient(135deg, #0d1420, #1a2744)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(232,160,32,0.2)' }}>
                <Bell size={18} style={{ color: '#e8a020' }} />
              </div>
              <div>
                <div className="font-black text-white text-lg">התראות</div>
                {unread > 0 && (
                  <div className="text-xs" style={{ color: '#e8a020' }}>{unread} לא נקראו</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleReadAll}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold"
                  style={{ background: 'rgba(232,160,32,0.2)', color: '#e8a020' }}>
                  <CheckCheck size={13} /> סמן הכל
                </button>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80dvh - 80px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="text-center py-14 px-6">
                <div className="text-5xl mb-3">🔔</div>
                <div className="font-bold text-gray-700">אין התראות עדיין</div>
                <div className="text-gray-400 text-sm mt-1">התראות יופיעו כאן בזמן אמת</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifs.map(n => (
                  <div key={n.Id}
                    className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                      !n.IsRead ? 'bg-amber-50/50' : 'bg-white'
                    }`}>
                    {/* אייקון */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: !n.IsRead ? 'rgba(232,160,32,0.12)' : '#f8fafc' }}>
                      {iconFor(n.Title)}
                    </div>

                    {/* תוכן */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold truncate ${!n.IsRead ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.Title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.Body}</div>
                      <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                        {timeLabel(n.MinutesAgo)}
                      </div>
                    </div>

                    {/* נקודה לא נקרא */}
                    {!n.IsRead && (
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: '#e8a020' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};
