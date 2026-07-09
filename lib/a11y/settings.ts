/**
 * Client-side accessibility preferences that power the on-site accessibility
 * widget (רכיב נגישות). Settings are persisted to localStorage and re-applied
 * on every page load — both by an inline bootstrap script in the document head
 * (to avoid a flash of un-adjusted content) and by the React widget component.
 *
 * Everything here must stay framework-agnostic and side-effect free at import
 * time, because the same `applyA11ySettings` logic is serialised into an inline
 * <script> in the root layout.
 */

export const A11Y_STORAGE_KEY = "hadad-a11y";

/** Discrete font-size steps, as a multiplier of the browser's default size. */
export const FONT_SCALE_STEPS = [1, 1.1, 1.25, 1.4, 1.6] as const;

export type A11ySettings = {
  /** Index into FONT_SCALE_STEPS. */
  fontStep: number;
  contrast: "none" | "dark" | "light";
  readableFont: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
  stopAnimations: boolean;
};

export const DEFAULT_A11Y_SETTINGS: A11ySettings = {
  fontStep: 0,
  contrast: "none",
  readableFont: false,
  highlightLinks: false,
  bigCursor: false,
  stopAnimations: false,
};

export function isDefaultSettings(s: A11ySettings): boolean {
  return (
    s.fontStep === 0 &&
    s.contrast === "none" &&
    !s.readableFont &&
    !s.highlightLinks &&
    !s.bigCursor &&
    !s.stopAnimations
  );
}
