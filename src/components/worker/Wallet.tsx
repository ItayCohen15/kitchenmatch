import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, FileText, X, Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';

const MONTH_NAMES = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];

/* ─── קבלה ─── */
const Receipt = ({ shift, onClose }: { shift: any; onClose: () => void }) => {
  const start = new Date(shift.StartTime);
  const end   = new Date(shift.EndTime);
  const hours = ((end.getTime()-start.getTime())/3600000).toFixed(2);
  const gross = (parseFloat(hours)*shift.HourlyRate).toFixed(2);
  const commission = (parseFloat(gross)*0.065).toFixed(2);
  const net   = (parseFloat(gross)-parseFloat(commission)).toFixed(2);
  const dateStr = start.toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit',year:'numeric'});
  const receiptNum = `KM-${shift.Id?.toString().padStart(5,'0')}`;

  const handlePrint = () => {
    const w = window.open('','_blank');
    if (!w) return;
    w.document.write(`
      <html dir="rtl"><head><meta charset="UTF-8"><title>קבלה ${receiptNum}</title>
      <style>
        body{font-family:Arial,sans-serif;max-width:400px;margin:30px auto;padding:20px;color:#111}
        .logo{font-size:22px;font-weight:900;margin-bottom:4px}.gold{color:#c8840a}
        .sub{color:#888;font-size:12px;margin-bottom:16px}
        h2{font-size:16px;border-bottom:2px solid #e8a020;padding-bottom:6px;margin:12px 0}
        .row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px;border-bottom:1px solid #f0f0f0}
        .total{font-weight:900;font-size:16px;color:#059669;margin-top:8px}
        .footer{margin-top:20px;font-size:11px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:10px}
        @media print{body{margin:0}}
      </style></head><body>
      <div class="logo">Kitchen<span class="gold">Match</span></div>
      <div class="sub">קבלה מס׳ ${receiptNum} · ${dateStr}</div>
      <h2>פרטי משמרת</h2>
      <div class="row"><span>מסעדה</span><strong>${shift.RestaurantName||''}</strong></div>
      <div class="row"><span>עיר</span><span>${shift.RestaurantCity||''}</span></div>
      <div class="row"><span>תפקיד</span><span>${ROLE_LABELS[shift.Role]||shift.Role||''}</span></div>
      <div class="row"><span>תאריך</span><span>${dateStr}</span></div>
      <div class="row"><span>שעות עבודה</span><span>${hours} שעות</span></div>
      <div class="row"><span>תעריף שעתי</span><span>₪${shift.HourlyRate}</span></div>
      <h2>פירוט תשלום</h2>
      <div class="row"><span>ברוטו</span><span>₪${gross}</span></div>
      <div class="row"><span>עמלת פלטפורמה (6.5%)</span><span>-₪${commission}</span></div>
      <div class="row total"><span>נטו לתשלום</span><span>₪${net}</span></div>
      <div class="footer">KitchenMatch — kitchenmatch.vercel.app<br/>מסמך זה משמש כאסמכתא לתשלום</div>
      <script>window.onload=()=>{window.print();window.close()}</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose}/>
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm mx-auto"
        style={{maxHeight:'85dvh',overflowY:'auto'}}>

        {/* Header */}
        <div className="p-5 text-white" style={{background:'linear-gradient(135deg,#0d1420,#1a2744)'}}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-black text-lg">Kitchen<span style={{color:'#e8a020'}}>Match</span></div>
              <div className="text-gray-400 text-xs">קבלה מס׳ {receiptNum}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10">
              <X size={16}/>
            </button>
          </div>
          <div className="text-center py-3">
            <div className="text-4xl font-black" style={{color:'#e8a020'}}>₪{net}</div>
            <div className="text-gray-400 text-sm">נטו לאחר עמלה</div>
          </div>
        </div>

        {/* פרטים */}
        <div className="p-5 space-y-0">
          {[
            { l:'מסעדה',    v: shift.RestaurantName||'' },
            { l:'תפקיד',    v: ROLE_LABELS[shift.Role]||shift.Role||'' },
            { l:'תאריך',    v: dateStr },
            { l:'שעות',     v: `${hours} ש׳` },
            { l:'תעריף',    v: `₪${shift.HourlyRate}/ש׳` },
          ].map(r => (
            <div key={r.l} className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
              <span className="text-gray-400">{r.l}</span>
              <span className="font-semibold text-gray-900">{r.v}</span>
            </div>
          ))}
          <div className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
            <span className="text-gray-400">ברוטו</span>
            <span className="font-semibold text-gray-900">₪{gross}</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
            <span className="text-gray-400">עמלה (6.5%)</span>
            <span className="font-semibold text-red-500">-₪{commission}</span>
          </div>
          <div className="flex justify-between pt-3 pb-1">
            <span className="font-bold text-gray-900">סה״כ נטו</span>
            <span className="font-black text-green-600 text-xl">₪{net}</span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button onClick={handlePrint}
            className="w-full text-white rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2"
            style={{background:'linear-gradient(135deg,#e8a020,#f0c050)',boxShadow:'0 4px 20px rgba(232,160,32,0.3)'}}>
            <Printer size={18}/> הדפס / שמור קבלה
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">פתח בדפדפן לשמירה כ-PDF</p>
        </div>
      </div>
    </>
  );
};

/* ─── ראשי ─── */
export const WorkerWallet: React.FC = () => {
  const { userProfile } = useApp();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview'|'receipts'>('overview');

  const totalEarnings  = userProfile?.TotalEarnings || 0;
  const completedShifts = userProfile?.CompletedShifts || 0;
  const hourlyRate     = userProfile?.HourlyRate || 0;

  useEffect(() => {
    if (!userProfile?.Id) { setLoading(false); return; }
    api.getWorkerHistory(userProfile.Id)
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(()=>[])
      .finally(()=>setLoading(false));
  }, [userProfile?.Id]);

  const completed = history.filter(j => j.Status === 'completed');

  // חודשי
  const monthlyMap: Record<string,number> = {};
  completed.forEach(j => {
    const key = MONTH_NAMES[new Date(j.StartTime).getMonth()];
    const h = ((new Date(j.EndTime).getTime()-new Date(j.StartTime).getTime())/3600000);
    monthlyMap[key] = (monthlyMap[key]||0) + h * j.HourlyRate * 0.935;
  });
  const monthlyData = Object.entries(monthlyMap).map(([m,v]) => ({ month:m, earn: Math.round(v) }));

  const avgPerShift = completedShifts > 0 ? (totalEarnings/completedShifts).toFixed(0) : '0';

  return (
    <div className="screen-enter space-y-4 pb-4">

      {/* Header */}
      <div className="rounded-3xl p-5 text-white" style={{background:'linear-gradient(135deg,#0d1420,#1a2744)'}}>
        <div className="text-gray-400 text-sm mb-1">סה״כ הכנסות (נטו)</div>
        <div className="text-4xl font-black mb-3" style={{color:'#e8a020'}}>
          ₪{totalEarnings.toLocaleString()}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { l:'משמרות', v: completedShifts, c:'text-white' },
            { l:'ממוצע/משמרת', v:`₪${avgPerShift}`, c:'text-amber-400' },
            { l:'תעריף/שעה', v:`₪${hourlyRate}`, c:'text-blue-300' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 rounded-xl p-2.5 text-center">
              <div className={`font-black text-sm ${s.c}`}>{s.v}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {[{id:'overview',l:'סקירה 📊'},{id:'receipts',l:'קבלות 🧾'}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab===t.id ? 'bg-white text-gray-900 shadow' : 'text-gray-400'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* גרף הכנסות */}
          {monthlyData.length > 0 && (
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <h3 className="font-bold text-gray-800 mb-4">הכנסות חודשיות</h3>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={monthlyData} margin={{top:5,right:5,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v:any) => [`₪${v}`, 'הכנסות']}/>
                  <Area type="monotone" dataKey="earn" stroke="#10b981" strokeWidth={2.5} fill="url(#eg)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* סטטיסטיקות */}
          {completed.length > 0 && (
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <h3 className="font-bold text-gray-800 mb-3">📈 סטטיסטיקות</h3>
              <div className="space-y-3">
                {[
                  { l:'שעות עבודה סה״כ',
                    v:`${completed.reduce((s,j)=>s+(new Date(j.EndTime).getTime()-new Date(j.StartTime).getTime())/3600000,0).toFixed(1)} ש׳` },
                  { l:'תעריף שעתי ממוצע',
                    v:`₪${(completed.reduce((s,j)=>s+j.HourlyRate,0)/completed.length).toFixed(0)}/ש׳` },
                  { l:'מסעדות שונות',
                    v:`${new Set(completed.map(j=>j.RestaurantId)).size}` },
                ].map(s => (
                  <div key={s.l} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500 text-sm">{s.l}</span>
                    <span className="font-bold text-gray-900 text-sm">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length === 0 && !loading && (
            <div className="text-center py-10 bg-white rounded-2xl card-shadow">
              <div className="text-4xl mb-3">💰</div>
              <p className="font-bold text-gray-700">אין הכנסות עדיין</p>
              <p className="text-gray-400 text-sm mt-1">השלם משמרות כדי לצבור הכנסות</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'receipts' && (
        <div className="space-y-3">
          {loading && <div className="text-center py-8"><div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"/></div>}

          {!loading && completed.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl card-shadow">
              <div className="text-4xl mb-3">🧾</div>
              <p className="font-bold text-gray-700">אין קבלות עדיין</p>
              <p className="text-gray-400 text-sm mt-1">קבלות יופיעו לאחר השלמת משמרות</p>
            </div>
          )}

          {completed.map(shift => {
            const start = new Date(shift.StartTime);
            const end   = new Date(shift.EndTime);
            const hours = ((end.getTime()-start.getTime())/3600000).toFixed(1);
            const net   = (parseFloat(hours)*shift.HourlyRate*0.935).toFixed(0);
            return (
              <div key={shift.Id} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-900">{shift.RestaurantName}</div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {start.toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit',year:'2-digit'})} · {hours} ש׳
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-green-600 text-lg">₪{net}</div>
                    <div className="text-gray-400 text-xs">נטו</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full"
                    style={{background:'linear-gradient(135deg,#3b82f6,#6366f1)'}}>
                    {ROLE_LABELS[shift.Role]||shift.Role}
                  </span>
                  <span className="text-xs text-gray-400">₪{shift.HourlyRate}/ש׳</span>
                  <button onClick={() => setReceipt(shift)}
                    className="mr-auto flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
                    style={{background:'rgba(232,160,32,0.1)',color:'#c8840a'}}>
                    <FileText size={13}/> קבלה
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {receipt && <Receipt shift={receipt} onClose={() => setReceipt(null)}/>}
    </div>
  );
};
