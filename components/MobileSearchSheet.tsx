"use client";

import { BottomSheet } from "@/components/BottomSheet";
import { SearchBar } from "@/components/SearchBar";

/**
 * Full-width mobile search sheet — cleaner than an inline expand panel and
 * keeps the floating header compact while searching.
 */
export function MobileSearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} placement="bottom" title="חיפוש מוצרים">
      <div className="p-5 pt-2">
        <SearchBar autoFocus={open} size="lg" onNavigate={onClose} />
        <p className="mt-4 text-center text-xs text-graphite-soft/60">
          חפשו לפי שם, מותג, מק״ט או קטגוריה — למשל מקרר, כביסה, תנור
        </p>
      </div>
    </BottomSheet>
  );
}
