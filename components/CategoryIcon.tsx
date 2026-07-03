const ICONS: Record<string, string> = {
  "מקררים": "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm0 8h12M9 6v2M9 14v2",
  "מקפיאים": "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm0 5.5h12m-12 5h12M9 5.5v2M9 13v2",
  "מכונות כביסה": "M4 4h16v16H4V4Zm8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM6.5 6.5h.01M9 6.5h.01",
  "מייבשי כביסה": "M4 4h16v16H4V4Zm8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-2-4a2 2 0 1 0 4 0",
  "מדיחי כלים": "M4 4h16v16H4V4Zm3 4h10M7 8v12m10-12v12M12 8v3",
  "תנורים": "M4 4h16v16H4V4Zm2 6h12v8H6v-8Zm0-3h.01M9 7h.01M12 7h.01",
  "כיריים": "M4 5h16v14H4V5Zm4 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  "קולטי אדים": "M4 6h16l-2 4H6L4 6Zm6 4v10m4-10v10",
  "מיקרוגלים": "M3 6h18v12H3V6Zm3 3h9v6H6V9Zm12 1.5h.01M18 13h.01",
  "טלוויזיות": "M4 5h16v11H4V5Zm5 15h6m-3-4v4",
  "מזגנים": "M3 7h18v5H3V7Zm2 5 1.5 4M9 12l1 5M15 12l-1 5M19 12l-1.5 4",
  "מוצרי חשמל קטנים": "M8 3h8v6a4 4 0 0 1-4 4 4 4 0 0 1-4-4V3Zm4 10v8m-4 0h8",
  "אביזרים נלווים": "M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.8 2.8m5.8 5.8 2.8 2.8M6.3 17.7l2.8-2.8m5.8-5.8 2.8-2.8",
};

const DEFAULT_ICON = "M4 4h16v16H4V4Zm4 4h8v8H8V8Z";

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const path = ICONS[name] ?? DEFAULT_ICON;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}
