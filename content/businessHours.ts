export interface BusinessHoursEntry {
  day: string;
  hours: string;
}

/** Verified against the store's Google Business profile on 2026-07-18. */
export const BUSINESS_HOURS: BusinessHoursEntry[] = [
  { day: "ראשון, שני, רביעי וחמישי", hours: "08:30–20:00" },
  { day: "שלישי", hours: "08:30–14:00" },
  { day: "שישי", hours: "08:30–14:00" },
  { day: "שבת", hours: "סגור" },
];

export const BUSINESS_HOURS_SCHEMA = [
  {
    dayOfWeek: ["Sunday", "Monday", "Wednesday", "Thursday"],
    opens: "08:30",
    closes: "20:00",
  },
  { dayOfWeek: ["Tuesday", "Friday"], opens: "08:30", closes: "14:00" },
] as const;
