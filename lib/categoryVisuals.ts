const IMAGE_ROOT = "/images/redesign";

/**
 * Every live catalog category resolves to a purpose-built visual family.
 * The catalog has many narrow small-appliance categories, so closely related
 * categories intentionally share one coherent editorial scene.
 */
const CATEGORY_VISUALS: Record<string, string> = {
  refrigerators: "category-refrigerators.png",
  freezers: "category-freezers.png",
  "washing-machines": "category-washing-machines.png",
  dryers: "category-dryers.png",
  dishwashers: "category-dishwashers.png",
  ovens: "category-ovens.png",
  cooktops: "category-cooktops.png",
  "range-hoods": "category-range-hoods.png",
  microwaves: "category-microwaves.png",
  "microwave-ovens": "category-microwaves.png",
  tvs: "category-tvs.png",
  "air-conditioners": "category-air-conditioners.png",
  "vacuum-cleaners": "category-vacuums.png",
  "robot-vacuums": "category-vacuums.png",
  "steam-cleaners": "category-vacuums.png",

  fans: "category-fans.png",
  speakers: "category-audio.png",
  soundbars: "category-audio.png",
  amplifiers: "category-audio.png",
  "stereo-systems": "category-audio.png",
  radios: "category-audio.png",
  headphones: "category-audio.png",
  projectors: "category-electronics.png",
  phones: "category-phones.png",

  shavers: "category-personal-care.png",
  "hair-clippers": "category-personal-care.png",
  "hair-dryers": "category-personal-care.png",
  "hair-stylers": "category-personal-care.png",
  "hair-straighteners": "category-personal-care.png",
  epilators: "category-personal-care.png",
  "electric-toothbrushes": "category-personal-care.png",

  "small-appliances": "category-small-appliances.png",
  blenders: "category-small-appliances.png",
  mixers: "category-small-appliances.png",
  kettles: "category-small-appliances.png",
  toasters: "category-small-appliances.png",
  juicers: "category-small-appliances.png",
  "food-processors": "category-small-appliances.png",
  "meat-grinders": "category-small-appliances.png",
  "coffee-machines": "category-small-appliances.png",
  "coffee-grinders": "category-small-appliances.png",
  "milk-frothers": "category-water.png",

  "air-fryers": "category-countertop-cooking.png",
  "deep-fryers": "category-countertop-cooking.png",
  "toaster-ovens": "category-countertop-cooking.png",
  "panini-grills": "category-countertop-cooking.png",
  "electric-grills": "category-countertop-cooking.png",
  "hot-plates": "category-countertop-cooking.png",
  "shabbat-hot-plates": "category-countertop-cooking.png",
  "electric-pans": "category-countertop-cooking.png",
  "cooking-pots": "category-countertop-cooking.png",
  "grill-pans": "category-countertop-cooking.png",
  "waffle-makers": "category-countertop-cooking.png",
  "ice-cream-makers": "category-countertop-cooking.png",
  "popcorn-makers": "category-countertop-cooking.png",
  trimmers: "category-small-appliances.png",

  heaters: "category-heating.png",
  "space-heaters": "category-heating.png",
  "air-coolers": "category-heating.png",
  "air-purifiers": "category-air-conditioners.png",
  humidifiers: "category-water.png",
  "electric-blankets": "category-heating.png",
  "heating-pads": "category-heating.png",

  "water-dispensers": "category-water.png",
  "wine-coolers": "category-wine-ice.png",
  "ice-makers": "category-wine-ice.png",
  "gaming-chairs": "category-office-gaming.png",

  accessories: "category-accessories.png",
  converters: "category-electronics.png",
  "emergency-lighting": "category-electronics.png",
  "mosquito-killers": "category-electronics.png",
  scales: "category-electronics.png",
};

export function categoryImageFor(slug: string): string {
  return `${IMAGE_ROOT}/${CATEGORY_VISUALS[slug] ?? "category-small-appliances.png"}`;
}
