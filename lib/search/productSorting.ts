import type { Product } from "@/types/product";

function compareImageAvailability(a: Product, b: Product): number {
  return Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl));
}

/**
 * Keeps the existing relevance/order inside each group, while ensuring that
 * products with a usable catalog image are always presented first.
 */
export function prioritizeProductsWithImages(products: Product[]): Product[] {
  return [...products].sort(compareImageAvailability);
}

export function sortProducts(products: Product[], sort?: string): Product[] {
  const list = [...products];
  switch (sort) {
    case "in-stock":
      return list.sort(
        (a, b) =>
          compareImageAvailability(a, b) ||
          Number(b.availability === "in_stock") - Number(a.availability === "in_stock")
      );
    case "newest":
      return prioritizeProductsWithImages(list.reverse());
    case "alpha":
      return list.sort(
        (a, b) => compareImageAvailability(a, b) || a.name.localeCompare(b.name, "he")
      );
    default:
      return list.sort(
        (a, b) =>
          compareImageAvailability(a, b) ||
          Number(b.availability === "in_stock") - Number(a.availability === "in_stock")
      );
  }
}
