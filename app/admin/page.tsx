import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyToken, isAdminConfigured } from "@/lib/analytics/auth";
import { getDashboardData, storePing } from "@/lib/analytics/events";
import { getStoreEnvStatus } from "@/lib/analytics/store";
import { getCategories, getBrands, getProducts } from "@/lib/base44/catalog";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

// Never indexed, never cached, always rendered on demand.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "לוח בקרה",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function AdminPage() {
  const configured = isAdminConfigured();
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const authed = configured ? await verifyToken(token) : false;

  if (!authed) {
    return <AdminLogin configured={configured} />;
  }

  const [data, connected, categories, brands, products] = await Promise.all([
    getDashboardData(30),
    storePing(),
    getCategories(),
    getBrands(),
    getProducts(),
  ]);

  const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const brandNames = Object.fromEntries(brands.map((b) => [b.slug, b.name]));
  const productNames = Object.fromEntries(products.map((p) => [p.slug, p.name]));

  return (
    <AdminDashboard
      data={data}
      connected={connected}
      envStatus={getStoreEnvStatus()}
      categoryNames={categoryNames}
      brandNames={brandNames}
      productNames={productNames}
    />
  );
}
