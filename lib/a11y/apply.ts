import { A11Y_STORAGE_KEY, FONT_SCALE_STEPS, type A11ySettings } from "./settings";

declare global {
  interface Window {
    __applyA11y?: (settings: A11ySettings) => void;
  }
}

/**
 * Self-contained bootstrap injected into <head> so persisted accessibility
 * preferences are applied before first paint (no flash of un-adjusted content).
 * It also exposes `window.__applyA11y`, which the React widget reuses so there
 * is a single source of truth for how settings map onto the DOM.
 *
 * Class names applied on <html>:
 *   a11y-contrast-dark / a11y-contrast-light — forced high-contrast palettes
 *   a11y-readable                           — legible font + wider spacing
 *   a11y-links                              — underline + outline every link
 *   a11y-cursor                             — enlarged cursor
 *   a11y-noanim                             — freeze animations/transitions
 */
export const A11Y_BOOTSTRAP_SCRIPT = `(function(){
var KEY=${JSON.stringify(A11Y_STORAGE_KEY)};
var STEPS=${JSON.stringify([...FONT_SCALE_STEPS])};
function apply(s){
if(!s)return;
var el=document.documentElement,cl=el.classList;
var i=parseInt(s.fontStep,10)||0;if(i<0)i=0;if(i>STEPS.length-1)i=STEPS.length-1;
el.style.fontSize=i===0?"":(STEPS[i]*100)+"%";
cl.toggle("a11y-contrast-dark",s.contrast==="dark");
cl.toggle("a11y-contrast-light",s.contrast==="light");
cl.toggle("a11y-readable",!!s.readableFont);
cl.toggle("a11y-links",!!s.highlightLinks);
cl.toggle("a11y-cursor",!!s.bigCursor);
cl.toggle("a11y-noanim",!!s.stopAnimations);
}
window.__applyA11y=apply;
try{var raw=localStorage.getItem(KEY);if(raw)apply(JSON.parse(raw));}catch(e){}
})();`;

/** Push the given settings onto the DOM via the shared bootstrap function. */
export function applyA11ySettings(settings: A11ySettings): void {
  if (typeof window !== "undefined" && typeof window.__applyA11y === "function") {
    window.__applyA11y(settings);
  }
}
