export interface BusinessHoursEntry {
  day: string;
  hours: string;
}

/**
 * TODO: confirm exact business hours with the store owner and update here.
 * Placeholder hours shown below are typical Israeli retail hours and are
 * NOT confirmed — do not treat as final until verified.
 */
export const BUSINESS_HOURS: BusinessHoursEntry[] = [
  { day: "ראשון–חמישי", hours: "09:00–19:00 (לאימות מול החנות)" },
  { day: "שישי וערבי חג", hours: "09:00–14:00 (לאימות מול החנות)" },
  { day: "שבת", hours: "סגור" },
];
