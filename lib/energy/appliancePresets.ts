/**
 * Typical draw and use for the appliances the shop sells.
 *
 * Orders of magnitude, not measurements: the real figure differs a lot between
 * models, and every surface that shows these says so. They live outside the
 * calculator component so the consumption-table guide, a server page, can
 * render the same numbers the calculator starts from.
 */

export interface Preset {
  label: string;
  watts: number;
  hours: number;
  /** Share of the running time spent at full power (thermostat appliances). */
  duty: number;
  days: number;
  categorySlug?: string;
  categoryLabel?: string;
}

export const APPLIANCE_PRESETS: Record<string, Preset> = {
  refrigerator: { label: "מקרר", watts: 150, hours: 24, duty: 40, days: 30, categorySlug: "refrigerators", categoryLabel: "מקררים" },
  freezer: { label: "מקפיא", watts: 120, hours: 24, duty: 40, days: 30, categorySlug: "freezers", categoryLabel: "מקפיאים" },
  washer: { label: "מכונת כביסה (מחזור של שעה)", watts: 500, hours: 1, duty: 100, days: 30, categorySlug: "washing-machines", categoryLabel: "מכונות כביסה" },
  dryer: { label: "מייבש כביסה", watts: 3000, hours: 1.5, duty: 100, days: 12, categorySlug: "dryers", categoryLabel: "מייבשי כביסה" },
  dishwasher: { label: "מדיח כלים", watts: 1000, hours: 1, duty: 100, days: 30, categorySlug: "dishwashers", categoryLabel: "מדיחי כלים" },
  oven: { label: "תנור אפייה", watts: 2000, hours: 1, duty: 100, days: 12, categorySlug: "ovens", categoryLabel: "תנורים" },
  cooktop: { label: "כיריים אינדוקציה (להבה אחת)", watts: 2000, hours: 0.5, duty: 100, days: 30, categorySlug: "cooktops", categoryLabel: "כיריים" },
  microwave: { label: "מיקרוגל", watts: 1000, hours: 0.25, duty: 100, days: 30, categorySlug: "microwaves", categoryLabel: "מיקרוגלים" },
  kettle: { label: "קומקום", watts: 2000, hours: 0.2, duty: 100, days: 30, categorySlug: "kettles", categoryLabel: "קומקומים" },
  airFryer: { label: "סיר טיגון ללא שמן (אייר פרייר)", watts: 1500, hours: 0.5, duty: 100, days: 20, categorySlug: "air-fryers", categoryLabel: "סירי טיגון" },
  tv: { label: "טלוויזיה", watts: 100, hours: 4, duty: 100, days: 30, categorySlug: "tvs", categoryLabel: "טלוויזיות" },
  shabbatPlate: { label: "פלטת שבת (24 שעות, 4 שבתות)", watts: 400, hours: 24, duty: 100, days: 4, categorySlug: "shabbat-hot-plates", categoryLabel: "פלטות שבת" },
  heater: { label: "תנור חימום / רדיאטור", watts: 2000, hours: 3, duty: 100, days: 30, categorySlug: "heaters", categoryLabel: "תנורי חימום" },
  fan: { label: "מאוורר", watts: 50, hours: 8, duty: 100, days: 30, categorySlug: "fans", categoryLabel: "מאווררים" },
  coffee: { label: "מכונת קפה", watts: 1300, hours: 0.2, duty: 100, days: 30, categorySlug: "coffee-machines", categoryLabel: "מכונות קפה" },
  custom: { label: "מכשיר אחר — הזנה ידנית", watts: 2000, hours: 1, duty: 100, days: 30 },
};
