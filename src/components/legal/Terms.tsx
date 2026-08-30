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

export const Terms: React.FC<Props> = ({ onBack }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: '#f4f5f9', direction: 'rtl', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ flex: 'none', background: '#fff', borderBottom: '1px solid #e6e7ef', padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} aria-label="חזרה" style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #e6e7ef', background: '#f4f5f9', display: 'grid', placeItems: 'center', color: '#1b1e2e', flex: 'none' }}>
          <ArrowRight size={20} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#131626' }}>תקנון ותנאי שימוש</div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 16 }}>
        {/* Draft notice */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#8a5a00', background: '#fdf3d8', border: '1px solid #f0dfa6', borderRadius: 8, padding: '6px 10px', marginBottom: 12 }}>
          ⚠ טיוטה — לאישור עו״ד לפני השקה
        </div>

        <div style={{ background: '#fff', border: '1px solid #e6e7ef', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11.5, color: '#6b7180', marginBottom: 4 }}>עדכון אחרון: {UPDATED}</div>

          <h2 style={h2}>1. כללי</h2>
          <p style={p}>
            תקנון זה ("<b>התקנון</b>") מסדיר את השימוש בפלטפורמת Staffly ("<b>הפלטפורמה</b>", "<b>השירות</b>").
            השימוש בשירות, ההרשמה אליו והשימוש בפועל מהווים הסכמה מלאה לתקנון זה ולמדיניות הפרטיות. אם אינך מסכים
            לתנאים — אין לעשות שימוש בשירות.
          </p>

          <h2 style={h2}>2. מהות השירות</h2>
          <p style={p}>
            Staffly היא <b>פלטפורמת תיווך (marketplace)</b> המחברת בין בעלי עסקים בתחום ההסעדה לבין עובדי הסעדה
            עצמאיים/מזדמנים.{' '}
            <b>Staffly אינה המעסיק של העובדים ואינה צד ליחסי העבודה</b> שבין העסק לעובד. אחריות המעסיק, ככל שקיימת,
            חלה על העסק המזמין את המשמרת. Staffly אינה ערבה לביצוע המשמרת, להתנהלות הצדדים או לתוצאותיה.
          </p>

          <h2 style={h2}>3. הרשמה וחשבון</h2>
          <ul style={ul}>
            <li style={li}>ההרשמה מותנית במסירת מידע נכון, מלא ומעודכן.</li>
            <li style={li}>המשתמש אחראי לשמירת סודיות פרטי ההתחברות ולכל פעילות המתבצעת בחשבונו.</li>
            <li style={li}>השימוש מותר למי שמלאו לו 18 שנים (או גיל ההעסקה החוקי לפי דין) בלבד.</li>
            <li style={li}>אנו רשאים להשעות או לסגור חשבון במקרה של הפרת התקנון, חשד להונאה או שימוש לרעה.</li>
          </ul>

          <h2 style={h2}>4. תפקידי הצדדים ואחריותם</h2>
          <p style={p}><b>המסעדה / העסק:</b></p>
          <ul style={ul}>
            <li style={li}>לפרסם משמרות מדויקות ולספק תנאי עבודה בטוחים וחוקיים.</li>
            <li style={li}>לשלם את מלוא התמורה בגין המשמרת דרך הפלטפורמה.</li>
            <li style={li}>לעמוד בדיני העבודה, הבטיחות והתברואה החלים עליו.</li>
          </ul>
          <p style={p}><b>העובד:</b></p>
          <ul style={ul}>
            <li style={li}>להציג מידע נכון על ניסיונו וכישוריו.</li>
            <li style={li}>להגיע בזמן ולבצע את העבודה במקצועיות ובתום לב.</li>
            <li style={li}>לעמוד בדרישות רישוי, כשירות ותברואה ככל שנדרש לתפקיד.</li>
          </ul>
          <p style={p}>
            <b>שני הצדדים</b> מתחייבים לנהוג בתום לב, ולא לעקוף את הפלטפורמה במטרה להתחמק מתשלום עמלה
            (non-circumvention).
          </p>

          <h2 style={h2}>5. מודל העמלות</h2>
          <p style={p}>
            Staffly גובה עמלת שירות (commission) בגין התיווך והתפעול, מהעסק ו/או מהעובד, כפי שיוצג בעת ביצוע
            העסקה. שיעורי העמלה עשויים להשתנות מעת לעת ויוצגו מראש לפני ביצוע העסקה. ייתכנו מבצעים והטבות
            (למשל משמרת ניסיון ללא עמלה או תוכנית "חבר מביא חבר"), בכפוף לתנאיהם.
          </p>

          <h2 style={h2}>6. תשלומים וחשבון נאמנות</h2>
          <p style={p}>
            התמורה בגין משמרת מועברת דרך <b>חשבון נאמנות (escrow) המנוהל על ידי חברת הסליקה</b> PayMe. העסק טוען
            את הסכום מראש, הכסף מוחזק בנאמנות עד להשלמת המשמרת, ולאחר מכן משוחרר לארנק העובד בניכוי העמלה. משיכות
            מבוצעות לחשבון שהעובד מגדיר אצל חברת הסליקה. <b>Staffly אינה מחזיקה בכספי המשתמשים במישרין</b> ואינה
            גוף פיננסי.
          </p>

          <h2 style={h2}>7. חשבוניות ומיסוי</h2>
          <p style={p}>
            כל צד אחראי באופן בלעדי לחובות המס והדיווח החלים עליו. עובד עצמאי אחראי להפקת חשבונית ולדיווח כדין.
            ככל שנעשה שימוש בשירות "חשבונית-לשכיר" / "עצמאי-שכיר" של ספק חיצוני, הדבר כפוף לתנאי אותו ספק ולהסכמת
            המשתמש.
          </p>

          <h2 style={h2}>8. ביטולים ואי-הגעה</h2>
          <p style={p}>
            מדיניות הביטול ואי-ההגעה (no-show) תוצג באפליקציה ותהווה חלק בלתי נפרד מתקנון זה. ביטול מאוחר או
            אי-הגעה עלולים לגרור חיובים, פגיעה בדירוג, השעיה או סגירת חשבון.
          </p>

          <h2 style={h2}>9. דירוגים ותוכן משתמשים</h2>
          <p style={p}>
            דירוגים, חוות דעת והודעות חייבים להיות אמינים, הוגנים וחוקיים. חל איסור על פרסום תוכן פוגעני, מטעה,
            מפר זכויות או בלתי-חוקי. אנו רשאים להסיר תוכן ולנקוט צעדים כנגד משתמשים המפרים הוראה זו.
          </p>

          <h2 style={h2}>10. התנהגות אסורה</h2>
          <p style={p}>
            חל איסור על הונאה, התחזות, הטרדה, עקיפת הפלטפורמה, שימוש לרעה בשירות, פגיעה באבטחת המערכת או כל שימוש
            בניגוד לדין או לתקנון זה.
          </p>

          <h2 style={h2}>11. הגבלת אחריות</h2>
          <p style={p}>
            השירות ניתן כמות שהוא ("as-is") ובכפוף לזמינות. Staffly אינה אחראית לאיכות ביצוע המשמרת, להתנהגות
            הצדדים, לנזקים עקיפים או תוצאתיים, או למחלוקות בין עסק לעובד. בכל מקרה, אחריותה הכוללת של Staffly,
            ככל שתחול, מוגבלת לסכום העמלות ששולמו לה בפועל בגין העסקה הרלוונטית. אין באמור כדי לגרוע מזכויות שאינן
            ניתנות לוויתור לפי דין.
          </p>

          <h2 style={h2}>12. שיפוי</h2>
          <p style={p}>
            המשתמש מתחייב לשפות את Staffly, נושאי המשרה והעובדים בה, בגין כל נזק, הוצאה או תביעה — לרבות הוצאות
            משפטיות סבירות — הנובעים מהפרת התקנון על ידו או מהפרת דין מצדו.
          </p>

          <h2 style={h2}>13. קניין רוחני</h2>
          <p style={p}>
            כל הזכויות בפלטפורמה, במותג "Staffly", בעיצוב, בקוד ובתוכן שמורות ל-Staffly. אין להעתיק, לשכפל או
            לעשות שימוש מסחרי בהם ללא הרשאה מראש ובכתב.
          </p>

          <h2 style={h2}>14. שינויים בשירות ובתקנון</h2>
          <p style={p}>
            אנו רשאים לעדכן את השירות ואת התקנון מעת לעת. נעדכן את תאריך "עדכון אחרון" בראש המסמך, והמשך השימוש
            לאחר העדכון מהווה הסכמה לתקנון המעודכן.
          </p>

          <h2 style={h2}>15. דין וסמכות שיפוט</h2>
          <p style={p}>
            על תקנון זה ועל השימוש בשירות יחול הדין הישראלי בלבד. סמכות השיפוט הבלעדית בכל עניין הנוגע לתקנון או
            לשירות נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו.
          </p>

          <h2 style={h2}>16. יצירת קשר</h2>
          <p style={p}>
            בכל שאלה בנוגע לתקנון זה ניתן לפנות אלינו בכתובת{' '}
            <a style={link} href="mailto:itay@stafflyil.com">itay@stafflyil.com</a>.
          </p>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
};
