import React, { useEffect, useState } from 'react';
import { X, Star, Phone, FileText, MapPin, Shield } from 'lucide-react';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { getLevel, levelFromShifts } from '../../utils/levels';
import { WorkerGallery } from './WorkerGallery';
import { NewWorkerBadge } from './NewWorkerBadge';
import { GradBadge } from './GradBadge';

interface Props {
  workerId: number;
  /** נתונים ראשוניים מהמועמדות (אופציונלי) — להצגה מהירה לפני טעינה */
  initial?: any;
  onClose: () => void;
}

export const WorkerProfileModal: React.FC<Props> = ({ workerId, initial, onClose }) => {
  const [worker, setWorker] = useState<any>(initial || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorker(workerId)
      .then(data => { if (data) setWorker((prev: any) => ({ ...prev, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workerId]);

  const name = worker?.Name || worker?.WorkerName || 'עובד';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const rating = worker?.Rating ?? worker?.WorkerRating ?? 0;
  const completed = worker?.CompletedShifts ?? 0;
  const reliability = worker?.ReliabilityScore ?? 100;
  const yearsExp = worker?.YearsExp ?? 0;
  const city = worker?.City || worker?.WorkerCity || '';
  const role = worker?.Role || worker?.WorkerRole || '';
  const phone = worker?.Phone || worker?.WorkerPhone || '';
  const bio = worker?.Bio || '';
  const skills = (worker?.Skills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const cvData = worker?.CvData || '';
  const cvName = worker?.CvName || 'קורות חיים';
  const lvl = getLevel(worker?.Level || levelFromShifts(completed).key);

  // פתיחת קו"ח בבטחה — מאמת data-URI מורשה בלבד ומרנדר דרך .src (לא הזרקת HTML),
  // כדי שערך זדוני ב-CvData לא יוכל להריץ סקריפט ולגנוב את הטוקן
  const CV_RE = /^data:(application\/pdf|image\/(png|jpe?g|webp|gif));base64,[A-Za-z0-9+/=]+$/;
  const openCv = () => {
    if (!cvData || !CV_RE.test(cvData)) { alert('קובץ קורות החיים אינו תקין'); return; }
    const w = window.open('');
    if (!w) return;
    const isPdf = cvData.startsWith('data:application/pdf');
    const el = w.document.createElement(isPdf ? 'iframe' : 'img');
    el.setAttribute('src', cvData);
    el.style.cssText = isPdf ? 'width:100%;height:100vh;border:0' : 'max-width:100%';
    const body = w.document.body || w.document.documentElement;
    body.style.margin = '0';
    body.appendChild(el);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none"
        style={{
          top: 'calc(env(safe-area-inset-top) + 64px)',
          bottom: 'calc(78px + env(safe-area-inset-bottom))',
        }}>
        <div className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm pointer-events-auto"
          style={{ maxHeight: '100%' }}>

          {/* Header */}
          <div className="flex-shrink-0 p-4 text-white" style={{ background:'linear-gradient(135deg,#0d1420,#1a2744)' }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg"
                  style={{ background: lvl.gradient }}>
                  {initials}
                </div>
                <div>
                  <div className="font-black text-lg">{name}</div>
                  <div className="text-gray-400 text-xs">
                    {city}{role ? ` · ${ROLE_LABELS[role] || role}` : ''}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <NewWorkerBadge completedShifts={completed} size="sm" />
                    <GradBadge isTrainee={worker?.IsTrainee} school={worker?.SchoolName} course={worker?.CourseType} size="sm" />
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: lvl.gradient, color: 'white' }}>
                      {lvl.label}
                    </span>
                    {rating > 0 && (
                      <span className="flex items-center gap-0.5 text-yellow-400 text-xs font-bold">
                        <Star size={11} className="fill-yellow-400" />{rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 active:bg-white/30 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ WebkitOverflowScrolling:'touch' as any }}>
            {/* סטטיסטיקות */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l:'משמרות', v: completed },
                { l:'אמינות', v: `${reliability}%` },
                { l:'ניסיון', v: `${yearsExp} שנ׳` },
              ].map(s => (
                <div key={s.l} className="bg-gray-50 rounded-xl p-2 text-center">
                  <div className="font-black text-gray-900 text-sm">{s.v}</div>
                  <div className="text-gray-400 text-[10px]">{s.l}</div>
                </div>
              ))}
            </div>

            {/* כישורים */}
            {skills.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1.5">כישורים</div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s: string) => (
                    <span key={s} className="text-xs bg-amber-50 text-amber-600 rounded-full px-2.5 py-1">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* אודות */}
            {bio && (
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1.5">קצת עליו</div>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-3">{bio}</p>
              </div>
            )}

            {/* קו"ח */}
            {cvData && (
              <button onClick={openCv}
                className="w-full flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-blue-700 text-sm font-semibold">
                <FileText size={15} /> <span className="truncate">{cvName}</span>
              </button>
            )}

            {/* גלריה */}
            <div>
              <div className="text-xs font-bold text-gray-500 mb-1.5">גלריית עבודות</div>
              <WorkerGallery workerId={workerId} />
              {loading && (
                <div className="text-center py-3">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}
            </div>

            {/* טלפון */}
            {phone && (
              <a href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl py-2.5 text-green-700 font-semibold text-sm"
                style={{ textDecoration:'none' }}>
                <Phone size={15} /> {phone}
              </a>
            )}

            <div className="flex items-center gap-1.5 text-green-600 text-xs justify-center">
              <Shield size={12} /> עובד מאומת ב-Staffly
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
