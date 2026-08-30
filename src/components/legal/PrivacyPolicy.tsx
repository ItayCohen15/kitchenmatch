// טיוטה — לאישור עו״ד לפני השקה
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  onBack: () => void;
}

// תאריך תחילת תוקף — לעדכן עם השקה/אישור משפטי
const UPDATED = '30 באוגוסט 2026';

const h2: React.CSSProperties = { fontSize: 14.5, fontWeight: 800, color: '#1b1e2e', margin: '18px 0 6px' };
const p:  React.CSSProperties = { fontSize: 13, lineHeight: 1.75, color: '#3f4453', margin: '0 0 9px' };
const ul: React.CSSProperties = { listStyleType: 'disc', paddingInlineStart: 20, margin: '0 0 10px' };
const li: React.CSSProperties = { fontSize: 13, lineHeight: 1.65, color: '#3f4453', margin: '0 0 5px' };
const link: React.CSSProperties = { color: '#5354d3', fontWeight: 700, textDecoration: 'none' };

export const PrivacyPolicy: React.FC<Props> = ({ onBack }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: '#f4f5f9', direction: 'rtl', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ flex: 'none', background: '#fff', borderBottom: '1px solid #e6e7ef', padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} aria-label="חזרה" style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #e6e7ef', background: '#f4f5f9', display: 'grid', placeItems: 'center', color: '#1b1e2e', flex: 'none' }}>
          <ArrowRight size={20} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#131626' }}>מדיניות פרטיות</div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 16 }}>
        {/* Draft notice */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#8a5a00', background: '#fdf3d8', border: '1px solid #f0dfa6', borderRadius: 8, padding: '6px 10px', marginBottom: 12 }}>
          ⚠ טיוטה — לאישור עו״ד לפני השקה
        </div>

        <div style={{ background: '#fff', border: '1px solid #e6e7ef', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11.5, color: '#6b7180', marginBottom: 4 }}>עדכון אחרון: {UPDATED}</div>

          <p style={p}>
            Staffly ("<b>אנחנו</b>", "<b>הפלטפורמה</b>") מפעילה שירות דיגיטלי המחבר בין בעלי עסקים בתחום ההסעדה
            (מסעדות, ברים, בתי קפה, אולמות אירועים וקייטרינג) לבין עובדי הסעדה. מדיניות זו מסבירה איזה מידע אישי
            אנו אוספים, כיצד אנו משתמשים בו, עם מי אנו חולקים אותו ומהן זכויותיך. השימוש בפלטפורמה מהווה הסכמה
            למדיניות זו.
          </p>

          <h2 style={h2}>1. איזה מידע אנו אוספים</h2>
          <ul style={ul}>
            <li style={li}><b>פרטי חשבון:</b> כתובת אימייל, סיסמה (נשמרת מגובבת/מוצפנת בלבד), שם מלא.</li>
            <li style={li}><b>פרטי פרופיל וקשר:</b> מספר טלפון, עיר/אזור, תפקיד, ניסיון, תעריף, תמונות פרופיל וגלריה, קורות חיים.</li>
            <li style={li}><b>מיקום גאוגרפי (geolocation):</b> לצורך התאמת משמרות קרובות ומעקב חי במהלך משמרת — בכפוף להרשאת המכשיר, שניתן לבטלה בכל עת.</li>
            <li style={li}><b>מידע פיננסי וארנק:</b> נתוני תשלום, יתרות ארנק ומשיכות — מעובדים באמצעות חברת הסליקה PayMe. איננו שומרים בשרתינו פרטי כרטיס אשראי או פרטי חשבון בנק מלאים.</li>
            <li style={li}><b>אסימוני התראות (push tokens):</b> לשליחת התראות על משמרות, הודעות ועדכונים.</li>
            <li style={li}><b>תכתובות:</b> הודעות צ'אט ותוכן שהוחלף בין הצדדים בתוך הפלטפורמה.</li>
            <li style={li}><b>מידע טכני:</b> כתובת IP, סוג דפדפן ומכשיר, נתוני שימוש ולוגים לצורכי אבטחה ותפעול.</li>
          </ul>

          <h2 style={h2}>2. למה אנו משתמשים במידע</h2>
          <ul style={ul}>
            <li style={li}>הפעלת השירות והתאמה בין עסקים לעובדים.</li>
            <li style={li}>אימות זהות, מניעת הונאה והגנה על המשתמשים.</li>
            <li style={li}>עיבוד תשלומים והעברות דרך חברת הסליקה וחשבון הנאמנות.</li>
            <li style={li}>שליחת התראות והודעות תפעוליות (אימות אימייל, איפוס סיסמה, עדכוני משמרת).</li>
            <li style={li}>שיפור השירות, ניתוח שימוש ואבטחת המערכת.</li>
            <li style={li}>עמידה בחובות חוקיות (מס, חשבונאות, אכיפה).</li>
          </ul>

          <h2 style={h2}>3. עם מי אנו חולקים מידע</h2>
          <p style={p}>אנו חולקים מידע רק במידה הנדרשת לצורך מתן השירות ועם הגורמים הבאים:</p>
          <ul style={ul}>
            <li style={li}><b>חברת הסליקה PayMe:</b> עיבוד תשלומים, ניהול חשבון נאמנות (escrow) וביצוע משיכות.</li>
            <li style={li}><b>ספק שירות "עצמאי-שכיר" / חשבונית-לשכיר:</b> להפקת חשבוניות/תלושים לעובדים, ככל שנדרש.</li>
            <li style={li}><b>ספקי אירוח וענן:</b> אחסון והרצת השירות (לרבות Vercel, Render ו-Microsoft Azure).</li>
            <li style={li}><b>ספק דיוור:</b> שליחת מיילים תפעוליים (לרבות Brevo).</li>
            <li style={li}><b>הצד השני לעסקה:</b> מסעדה ועובד רואים זה את פרטי זה הדרושים לביצוע המשמרת (שם, תפקיד, דירוג ופרטי קשר בסיסיים).</li>
            <li style={li}><b>רשויות מוסמכות:</b> כאשר נדרש על פי דין או צו שיפוטי.</li>
          </ul>
          <p style={p}><b>איננו מוכרים מידע אישי לצדדים שלישיים.</b></p>

          <h2 style={h2}>4. העברת מידע אל מחוץ לישראל</h2>
          <p style={p}>
            חלק מספקי השירות שלנו פועלים בשרתים הממוקמים מחוץ לישראל. העברת מידע כאמור נעשית בכפוף להוראות
            חוק הגנת הפרטיות והתקנות מכוחו.
          </p>

          <h2 style={h2}>5. שמירת מידע</h2>
          <p style={p}>
            נשמור את המידע כל עוד חשבונך פעיל, ולתקופה נוספת הנדרשת לצרכים חוקיים, חשבונאיים ומיסוייים — בין היתר
            שמירת מסמכי תשלום לתקופה הקבועה בדין. עם סגירת החשבון, נמחק או נהפוך לאנונימי מידע שאינו נדרש עוד,
            למעט מידע שחלה חובה לשומרו.
          </p>

          <h2 style={h2}>6. זכויותיך לפי חוק הגנת הפרטיות התשמ"א-1981</h2>
          <p style={p}>
            עומדת לך הזכות לעיין במידע שנאסף אודותיך, לבקש את תיקונו אם אינו נכון, שלם או מעודכן, ולבקש את מחיקתו
            בכפוף לחריגים הקבועים בדין. ניתן גם למחוק את החשבון ישירות מתוך האפליקציה. לבירור זכויות ולהגשת בקשה
            ניתן לפנות אל <a style={link} href="mailto:itay@stafflyil.com">itay@stafflyil.com</a>.
          </p>

          <h2 style={h2}>7. אבטחת מידע</h2>
          <p style={p}>
            אנו נוקטים אמצעי אבטחה מקובלים, לרבות הצפנת תעבורה (HTTPS), שמירת סיסמאות בגיבוב (hash), הרשאות
            מבוססות-תפקיד והגבלת גישה. עם זאת, אף מערכת אינה חסינה לחלוטין, ואיננו יכולים להבטיח הגנה מוחלטת מפני
            כל סיכון.
          </p>

          <h2 style={h2}>8. קטינים</h2>
          <p style={p}>
            השירות אינו מיועד למי שטרם מלאו לו 18 שנים (או גיל ההעסקה החוקי לפי דין). איננו אוספים ביודעין מידע
            על קטינים.
          </p>

          <h2 style={h2}>9. עוגיות ואחסון מקומי</h2>
          <p style={p}>
            אנו משתמשים ב-localStorage ובטכנולוגיות דומות לצורך שמירת מצב ההתחברות והעדפות המשתמש. ניתן לנקות
            אחסון זה דרך הגדרות הדפדפן, אך הדבר עשוי להשפיע על תפקוד השירות.
          </p>

          <h2 style={h2}>10. שינויים במדיניות</h2>
          <p style={p}>
            אנו רשאים לעדכן מדיניות זו מעת לעת. נעדכן את תאריך "עדכון אחרון" בראש המסמך, והמשך השימוש בשירות
            לאחר העדכון מהווה הסכמה למדיניות המעודכנת.
          </p>

          <h2 style={h2}>11. יצירת קשר</h2>
          <p style={p}>
            בכל שאלה בנוגע למדיניות פרטיות זו או לאופן הטיפול במידע שלך, ניתן לפנות אלינו בכתובת{' '}
            <a style={link} href="mailto:itay@stafflyil.com">itay@stafflyil.com</a>.
          </p>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};
