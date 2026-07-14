import type { DashboardData, RankedEntry } from "@/lib/analytics/events";
import { LogoutButton } from "@/components/admin/LogoutButton";

interface Props {
  data: DashboardData;
  categoryNames: Record<string, string>;
  brandNames: Record<string, string>;
  productNames: Record<string, string>;
}

function n(x: number | undefined): string {
  return (x ?? 0).toLocaleString("he-IL");
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 md:p-5 ${accent ? "border-brand-blue/30 bg-brand-blue-light" : "border-line bg-white"}`}>
      <p className="text-xs font-medium text-graphite-soft/70">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-graphite md:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-graphite-soft/60">{sub}</p>}
    </div>
  );
}

function RankedList({
  title,
  entries,
  names,
  suffix = "צפיות",
}: {
  title: string;
  entries: RankedEntry[];
  names?: Record<string, string>;
  suffix?: string;
}) {
  const max = entries.length ? entries[0].count : 0;
  return (
    <div className="rounded-2xl border border-line bg-white p-4 md:p-5">
      <h3 className="text-sm font-bold text-graphite">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-graphite-soft/50">אין נתונים עדיין</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((e) => (
            <li key={e.slug}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-graphite">{names?.[e.slug] ?? e.slug}</span>
                <span className="shrink-0 font-semibold text-graphite">
                  {n(e.count)} <span className="font-normal text-graphite-soft/50">{suffix}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-brand-blue/60" style={{ width: `${max ? (e.count / max) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminDashboard({ data, categoryNames, brandNames, productNames }: Props) {
  const t = data.totals;
  const waTotal = (t.whatsapp_click_header ?? 0) + (t.whatsapp_click_product ?? 0) + (t.whatsapp_click_basket ?? 0);

  const trendMax = Math.max(1, ...data.daily.map((d) => Object.values(d.events).reduce((a, b) => a + b, 0)));

  return (
    <div className="container-page py-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-graphite md:text-3xl">לוח בקרה עסקי</h1>
          <p className="mt-1 text-sm text-graphite-soft/60">
            חדד יובל אלקטריק · נתוני פעילות מצטברים
            {data.lastEventAt && ` · עודכן לאחרונה ${new Date(data.lastEventAt).toLocaleString("he-IL")}`}
          </p>
        </div>
        <LogoutButton />
      </div>

      {!data.configured && (
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">אחסון הנתונים לא מחובר.</p>
          <p className="mt-1 leading-relaxed">
            כדי להתחיל לאסוף נתונים, חברו מאגר <span className="font-mono">Vercel KV / Upstash Redis</span> לפרויקט
            (הוא מגדיר אוטומטית את <span className="font-mono">KV_REST_API_URL</span> ו-
            <span className="font-mono">KV_REST_API_TOKEN</span>). עד אז, הדף פעיל אך כל המונים מציגים 0.
          </p>
        </div>
      )}

      {/* Headline KPIs */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="פניות וואטסאפ (קליקים)"
          value={n(waTotal)}
          accent
          sub={`ראשי ${n(t.whatsapp_click_header)} · מוצר ${n(t.whatsapp_click_product)} · סל ${n(t.whatsapp_click_basket)}`}
        />
        <StatCard label="קליקים לחיוג טלפוני" value={n(t.phone_click)} accent />
        <StatCard label="צפיות במוצרים" value={n(t.product_view)} />
        <StatCard label="צפיות בקטגוריות" value={n(t.category_view)} />
        <StatCard label="צפיות במותגים" value={n(t.brand_view)} />
        <StatCard label="חיפושים באתר" value={n(t.search_query)} />
        <StatCard label="הוספות ל'הבקשה שלי'" value={n(t.product_add_to_request)} />
        <StatCard label="שליחות טופס צור קשר" value={n(t.contact_form_submit)} />
      </section>

      {/* Bots & AI */}
      <h2 className="mt-10 text-lg font-bold text-graphite md:text-2xl">בוטים ועוזרי AI</h2>
      <p className="mt-1 text-sm text-graphite-soft/60">
        סריקות = כמה פעמים בוט סרק את האתר. הגעות מ-AI = גולשים שהגיעו מקישור בתשובת עוזר AI (הפרוקסי הכי קרוב
        ל"המלצה"; אי אפשר לספור המלצות שנאמרו בצ'אט פרטי).
      </p>
      <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="סריקות בוטי AI" value={n(t.bot_ai_crawl)} accent sub="GPTBot, ClaudeBot, PerplexityBot ועוד" />
        <StatCard label="סריקות מנועי חיפוש" value={n(t.bot_search_crawl)} sub="Googlebot, Bingbot ועוד" />
        <StatCard label="הגעות מעוזרי AI" value={n(t.ai_referral_visit)} accent sub="ChatGPT, Perplexity, Gemini ועוד" />
      </section>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <RankedList title="פירוט בוטים (סריקות)" entries={data.bots} suffix="סריקות" />
        <RankedList title="הגעות לפי עוזר AI" entries={data.aiReferrals} suffix="הגעות" />
      </div>

      {/* Engagement */}
      <h2 className="mt-10 text-lg font-bold text-graphite md:text-2xl">מה מעניין את הגולשים</h2>
      <section className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <RankedList title="קטגוריות מובילות (צפיות בעמוד)" entries={data.topCategories} names={categoryNames} />
        <RankedList title="קטגוריות לפי צפיות במוצרים" entries={data.topProductCategories} names={categoryNames} />
        <RankedList title="מותגים מובילים" entries={data.topBrands} names={brandNames} />
        <RankedList title="המוצרים הנצפים ביותר" entries={data.topProducts} names={productNames} />
        <RankedList
          title="מוצרים מבוקשים בוואטסאפ"
          entries={data.topWhatsappProducts}
          names={productNames}
          suffix="פניות"
        />
      </section>

      {/* Trend */}
      <h2 className="mt-10 text-lg font-bold text-graphite md:text-2xl">מגמת פעילות — 30 יום</h2>
      <div className="mt-4 rounded-2xl border border-line bg-white p-4 md:p-5">
        <div className="flex h-32 items-end gap-1">
          {data.daily.map((d) => {
            const total = Object.values(d.events).reduce((a, b) => a + b, 0);
            return (
              <div
                key={d.date}
                title={`${d.date}: ${total} אירועים`}
                className="flex-1 rounded-t bg-brand-blue/50"
                style={{ height: `${(total / trendMax) * 100}%`, minHeight: total > 0 ? "3px" : "0" }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-graphite-soft/50">
          <span>{data.daily[0]?.date}</span>
          <span>{data.daily[data.daily.length - 1]?.date}</span>
        </div>
      </div>

      <p className="mt-8 text-xs text-graphite-soft/40">
        הנתונים מצטברים מרגע החיבור, נאספים בצורה אנונימית (ללא מידע אישי) ואינם מכבידים על האתר. קליקים משקפים
        כוונת פנייה, לא בהכרח שיחה/הודעה שהושלמה בפועל.
      </p>
    </div>
  );
}
