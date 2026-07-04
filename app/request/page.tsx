import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RequestBasketView } from "@/components/RequestBasketView";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "הבקשה שלי",
  description: "המוצרים שבחרתם לבדיקת זמינות והזמנה בוואטסאפ.",
  path: "/request",
  noindex: true,
});

export default function RequestPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "הבקשה שלי", path: "/request" }]} />
      <div className="container-page pb-12 md:pb-16">
        <h1 className="text-xl font-bold text-graphite md:text-4xl">הבקשה שלי</h1>
        <p className="mt-2 max-w-2xl text-sm text-graphite-soft/80 md:mt-3 md:text-base">
          המוצרים שבחרתם. ניתן להוסיף שם, טלפון והערות ולשלוח בקשה מרוכזת אחת בוואטסאפ לצוות החנות.
        </p>
        <div className="mt-6 md:mt-8">
          <RequestBasketView />
        </div>
      </div>
    </>
  );
}
