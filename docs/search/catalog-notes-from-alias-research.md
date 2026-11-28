# Catalog issues found while researching search names (2026-11-28)

Research agents checked every product while collecting the names shoppers type. These are the catalog problems they reported (wrong category, typos in names, misspelled brands). Fixing them in Base44 improves search and product pages.

## Brands

- Collision `בוש`: BOSCH, Bush — In Israel 'בוש' = Bosch. bug.co.il even titles Bush items 'בוש - BOSCH'. Mapped to BOSCH only; Bush gets 'bush'/'באש'.
- Collision `bosh`: BOSCH, Bush — Latin typo of Bosch; kept on BOSCH only.
- Collision `המילטון`: Hemilton, Hemilton Beach — Both brands are written 'המילטון' by shoppers. Added to both on purpose, so the query returns both.
- Collision `hamilton`: Hemilton, Hemilton Beach — Same as above. Added to both.
- Collision `סטיל / steel`: STEEL, STEEL PRO — Generic word for steel/stainless, appears in many product names. Not added as an alias.
- Collision `סרוויס / service`: SERVICE — Generic word (dinner set 'סרוויס', 'service'). Not added.
- Collision `קריסטל / crystal`: Crystal — Generic (crystal glass, Crystal UHD Samsung line). Not added.
- Collision `קרבון / carbon`: Carbon — Carbon filters for cooker hoods ('פילטר קרבון'). Only 'כיסא קרבון' / 'carbon chair' added.
- Collision `גולד / gold`: Gold Line — Color word (gold, rose gold). Only full 'גולד ליין' forms added.
- Collision `ליין / line`: Gold Line, SILVERLINE — Shared suffix. Not added alone.
- Collision `מג`: MAG — Substring of מגהץ/מגבר/מגירה/מגדל. Not added. 'מאג' added instead.
- Collision `mag`: MAG, Magimix — Prefix of 'magimix'. Safe only as a whole-token match.
- Collision `מידה`: Midea — Hebrew word for 'size'. Not added.
- Collision `טפל`: Tefal — Hebrew word. Not added. 'טפאל' added.
- Collision `brown`: Braun — Color word. Not added.
- Collision `mi`: Xiaomi — Too short / generic. Not added.
- Collision `dream`: Dreame — Generic English word. Not added. Hebrew 'דרים' added.
- Collision `pure / פיור`: Pure acoustics — 'Pure' is a product-line word (air purifiers, Philips/Dyson Pure). Only full 'פיור אקוסטיק' forms added.
- Collision `טורבו / turbo`: TURBOAIR — Turbo function or burner appears in many product names. Only 'טורבו אייר' added.
- Collision `star`: STAR — Appears in model names and terms like energy star. Only Hebrew 'סטאר' added. Even that is weak.
- Collision `king`: King — Used in 'king size' and similar. Only Hebrew 'קינג' added.
- Collision `סול / sol`: Sol exlusive — 'סול' is how retailers write SOL. As a substring it also hits 'סולארי' and SOUL. Added 'סול' as a whole-token alias. Use whole-token matching only.
- Collision `אלקטרו / electro`: Electra, Electrolux — Shared prefix, also matches Electro Hanan. Not added alone.
- Collision `רואה / רובה`: ROWA — Hebrew words ('sees', 'rifle'). Not added. Retailer spelling 'רווה' added.
- Collision `deluxe / דלוקס`: DLX — Generic marketing word. Not added.
- Collision `פרו / pro`: ProView, STEEL PRO, DAVO — Generic suffix. Not added alone.
- Collision `מולדת`: Moledet — Hebrew word 'homeland'. Low risk in an appliance store, so it was added. Flagged anyway.
- Collision `אומגה / omega`: Omega — Low risk ('omega 3'). Added.
- Collision `דום`: DOME — Hebrew word ('silence'). Low risk. Added.
- Collision `סיריוס`: Sirius, TAIYO, Cookivate, Pure acoustics — Sirius Electronics imports all four. A 'סיריוס' query maps to the Sirius brand only.
- Collision `יופי`: Anker — Hebrew word ('great'). Not added for eufy. Latin 'eufy' added.
- Collision `ציק`: HCIQ — Short form. Added only because it is the retailer spelling of CHiQ (צ'יק without geresh).
- Collision `קנדי`: Candy — Also the name Kennedy. Low risk. Added.
- Related brands Hemilton, Hemilton Beach: Probably NOT the same company. Hemilton is an Israeli private label (HEM-xxxx models). 'Hemilton Beach' is a misspelling of US Hamilton Beach. Shoppers write both as 'המילטון', so they share that alias. Merge only if the owner confirms.
- Related brands STEEL, STEEL PRO: Probably different. STEEL is the 90 cm range-cooker brand (Steel Cucine, Italy). STEEL PRO is a home slush/ice machine. Keep separate.
- Related brands Zaks: Zaks = Sachs brand (bug.co.il 'Sachs ... זקש'). 'sachs' added as an alias.
- Related brands HCIQ: Most likely a typo of CHiQ (Changhong), Hebrew 'צ'יק'. Consider renaming the catalog brand.
- Related brands Bloomberg: Most likely a typo of Blomberg (Arcelik group, same group as Beko and Grundig). Consider renaming the catalog brand.
- Related brands Sirius, TAIYO, Cookivate, Pure acoustics: Same Israeli importer (Sirius Electronics). Separate brands.
- Related brands Electrolux, AEG, Zanussi, FRIGIDAIRE: Same corporate group (Electrolux). Separate brands. Do not merge.
- Related brands BOSCH, Siemens: Same group (BSH). Separate brands.
- Related brands Beko, Grundig, Bloomberg: Same group (Arcelik). Separate brands.
- Related brands Haier, Candy: Same group (Haier). Separate brands.
- Related brands Tefal, Moulinex: Same group (Groupe SEB). Separate brands.
- Related brands DeLonghi, Kenwood, Braun: Same group (De'Longhi; Braun only for kitchen appliances). Separate brands.
- Related brands Ninja, Shark: Same company (SharkNinja). Separate brands.
- Related brands Hisense, Gorenje: Same group (Hisense). Separate brands.
- Related brands Midea, Toshiba: Midea owns Toshiba home appliances. Separate brands.
- Related brands SEMICOM, ECOEURO: bug.co.il names Semicom as the official importer of Eco Euro. Separate brands.

## g1-refrigeration

- Ninja FS301 (SLUSHi) and STEEL PRO FROSTY R1 are slush / frozen-drink machines but sit in 'מכשירי קרח' next to ice-cube makers. Slush queries (סלאש, ברד, גרניטה) are mapped here; consider a separate 'מכונות ברד' category.
- Brand 'Hemilton Beach' (86152-IS) is misspelled; the real brand is 'Hamilton Beach' (המילטון ביץ'). Brand 'Sol exlusive' also looks misspelled ('exclusive').
- FNE1075N (Beko) name ends with 'לבו', a typo for 'לבן'.
- BC-50 GLASS BLACK (Luxor) is spelled 'וטרינה' while every other product says 'ויטרינה'. Both spellings are added as aliases, but it is better to fix the name.
- BRB38G705DWW (Samsung) name contains 'ללא שבת', so a shopper searching 'שבת' or 'מקרר שבת' will hit this one product, which is the opposite of what they want. Only FQE905BX says 'התקן שבת'. Most fridges have a Sabbath mode but the names don't say so, so 'שבת' searches are weak in this category.
- 'פריג'ידר' is Israeli slang for any fridge, and it is also how people write the FRIGIDAIRE brand in Hebrew. It is added as a category alias for מקררים. All FRIGIDAIRE products here are fridges or freezers, so the two meanings don't conflict.
- 'יצרן קרח' is an alias for 'מכשירי קרח', but two fridge names also say 'יצרן קרח' (MAX-RDNH630DAID, RF59C701EB1). Results for it will mix fridges with ice makers.
- Frozix-700 and FROZIX-1000 names say 'מכשיר קרח יוקרתית': masculine noun with a feminine adjective.
- RF59C701EB1 name says '(ללא DID)'. Shoppers won't know the abbreviation; 'DID' = door-in-door.
- Several names leave out the colour (PVR2D335-WH, PUFF-215W, PVNF244-W, FNE1533P, TMF7262NHW, GR-1085), so colour searches like 'מקפיא לבן' miss them.
- Frigidaire Israeli models (FQE600*, FQF675GGM, FQE905BX, FQF620GBG), Beko GN1406222GW, Gorenje NRK6192SYW, Hisense RT102/RB70/RD54/RD45, Konka, Midea and house brands: no public line or marketing name was found, so they got no aliases.

## g2-tv-audio-phones

- CRITICAL: no TV name contains the word 'טלוויזיה' - every TV is named 'מסך N'' ...'. Category aliases and the phrase mappings טלוויזיה->מסך cover this, but consider a generic rewrite rule 'טלוויזיה <N> (אינץ)' -> 'מסך <N>' for any size, not just the sizes listed.
- Collision: 'מסך' also appears in Elta 6740 (רדיו דיסק נייד ... עם מסך 7 אינץ') in רדיו וטרנזיסטורים - it may show up in TV searches; boost category טלוויזיות for 'מסך' queries.
- Collision: 'מקרן' appears in both מקרנים (projector 'מקרן וידאו') and מקרני קול (soundbars 'מקרן קול'), and in LEXUS CK-5545 ('מקרן שעה לקיר'). A bare 'מקרן' query should prefer category מקרנים.
- MAG C27F100Y is a 27in curved PC monitor filed under טלוויזיות.
- TCL 50S5K name says '2K!' - it is a Full HD (1920x1080) QLED per tcl.com/uk; '2K' is misleading.
- Harper HRT-8 is a suitcase turntable but sits in מקרני קול (soundbars); better in מערכות סטריאו.
- LG SQC1 (2.1 soundbar) is in רמקולים while Polk Signa S2 and LG S45TR (same product type) are in מקרני קול; consider moving SQC1 to מקרני קול.
- Vtech BM-1000 baby intercom/monitor is in טלפונים; Elta 6740 portable DVD player is in רדיו וטרנזיסטורים.
- Xiaomi L65MA-SME: no public listing found for this exact code. The Israel-market code Xiaomi publishes is L65MB-SME (TV S Pro Mini LED 65 2026); the 2025 A Pro 65 is L65MA-S(EU). Verify the model number; no alias added.
- LG 75MRGB85B6C is 'Mini RGB evo' (MRGB85), not 'Micro RGB evo' (that is MRGB95) - the current catalog name 'MINI RGB' is correct.
- 'רסיבר' is ambiguous (AV receiver vs satellite/DVB receiver); added to מגברים in Hebrew and Arabic 'رسيفر' to ממירים (Arabic usage = satellite receiver).
- Importer tags in TV names ((אמטל), (סמליין), (ניופרו), (ניופאן), (סי דאטה - רשמי), (אס.ג'י)) are noise for search; they should not count toward matching, and shoppers rarely type them.
- Samsung UE75M80H / UE75M70H / UE65M70H are Samsung's 2026 'Mini LED' line (no quantum-dot layer, below Neo QLED); catalog name is accurate.
- Konka, Luxor, MAG, Aiwa, Premier, ROWA (except R55/R45 series), Pure acoustics, Aiwa NARA, Hyundai and most phone models: house/importer brands with no line names - skipped.

## g3-cooking

- HEM-2616 (Hemilton 'כירת בישול זוגית אינדוקציה עם כפתורים') is a portable cooker but sits in category 'כיריים' (built-in hobs); it belongs in 'כירות בישול'.
- ZVENM7K1 (Zanussi 'תנור משולב מיקרוגל', a 43L compact oven with microwave) is in 'תנורים'; it fits 'מיקרוגל משולב תנור' with the Samsung and Teka units.
- F7GBCT-674 name 'כיריים 75 ס"מ זכוכית שחורה' omits 'גז' (the G in the code and the siblings suggest a gas hob); a search for 'כיריים גז 75' may miss it.
- IT640BSC name has '60 ס"' (missing מ); MWS4020B name has 'שחור.' with a stray period.
- X9F-6 says '6 ראשים'; shoppers say 'להבות' or 'מבערים' (phrase mapping added).
- Both 'כיריים' (built-in hobs) and 'כירות בישול' (portable cookers) share the root כיר; the bare word 'כירה' was put on the portable category, 'כיריים' stays on built-in.
- Do NOT map 'תנור חימום', 'תנור ספירלה', 'תנור שמן' or 'תנור אינפרא' to 'תנורים' — those are heaters (another group). The bare word 'תנור' is ambiguous between ovens and heaters.
- 'אייר פרייר' was deliberately NOT added to the EOP7422K oven (it has an air-fry mode) to avoid pulling ovens into air-fryer searches; only 'תנור עם אייר פרייר' maps to it.
- Hebrew brand spellings shoppers type for brands in this group (worth a brand-level alias table if none exists): מידאה/מדיאה (Midea), אלקטרולוקס (Electrolux), בוש (BOSCH), סימנס (Siemens), סמסונג (Samsung), אל ג'י (LG), זנוסי (Zanussi), גורניה (Gorenje), גרונדיג (Grundig), בקו (Beko), פרטלי/פראטלי (Fratelli), לה קאזה/לקאזה (LaCasa), נורמנדה (Normande), פרו ויו (ProView), סול (Sol exlusive), גולד ליין (Gold Line), המילטון (Hemilton), סלמור (Selmor), זקס (Zaks), שארפ (Sharp), טושיבה (Toshiba), דלונגי (DeLonghi), טקה (Teka), לופרה (Lofra), סטיל (STEEL), סאוטר (Sauter), פרמייר (Premier), נקסומי (Nakasumi), פוג'יקום (Fujicom), סילברליין (SILVERLINE), טורבו אייר (TURBOAIR), קוקיווייט (Cookivate).
- Brand 'Sol exlusive' is misspelled (exclusive) in the catalog brand field.
- Siemens EC6A5HB90Y: the EC6A5 family is labelled iQ500 elsewhere, but no page confirmed this exact code, so no series alias was added. Same for Siemens HB279GBB0 and Bosch PKF631BB2E/PIE611BB5E (no confirmed Serie label).

## g4-laundry-cleaning

- Catalog brand 'HCIQ' (MC-W810-W) should be 'CHiQ' - shoppers typing CHiQ will not find it.
- Catalog brand 'Bloomberg' (LDF30212B, LDF30210X, LDF30210W, GSN209P8X, TGE583WTX) is really 'Blomberg' (בלומברג).
- Catalog model 'CrosssWave OmniFind 4006N' has a typo (three s); correct is 'CrossWave'.
- Catalog model 'VS80F2BDFP' appears nowhere online; Samsung's code is VS80F28DFP (Bespoke AI Jet Lite). Please check the box label.
- Catalog model 'HW100-14979S8' is likely 'HW100-B14979S8' (Haier I-Pro Series 7).
- Catalog model '2505-HEM' is listed by retailers as 'HEM-2505'; 'Q1 14323-IS' as '14323-IS Q1'. Add these variants to the model field if possible.
- '(KG120-Z12L24BY (700312' has broken parentheses in the model number.
- 'ARTIST 9' (Tineco) matches no page; the product sold in Israel is the Tineco Floor One S9 Artist - catalog specs differ, worth checking.
- DT1020G0 (Tefal) is sold by Israeli retailers as a travel handheld steamer (Origin Travel); catalog name 'מגהץ אדים אנכי 1200 וואט' may overstate it.
- 3700N (Bissell SpotClean HydroSteam Pro) is a carpet/upholstery spot cleaner; its catalog name does not mention ספות/שטיחים/ריפודים - consider adding 'לניקוי ספות ושטיחים' to the name.
- Y100 (UWANT) and M600 (UWANT) are upholstery/mattress cleaners; shoppers search 'ניקוי ספות', 'שואב ספות', 'שואב קרדית'.
- Electrolux EW5T7612AM, ESA47200SW/SX, EEQ47200L, EDH6284BM and AEG FSE63817P/TX6G821B: series names could not be confirmed, so no aliases added.
- 'רומבה' (iRobot Roomba) is used generically in Israel for robot vacuums; mapped to the robot category since no iRobot product is in the catalog.

## g5-climate-personal-misc

- Brand names in Hebrew/Arabic letters are not in the catalog text; suggested brand aliases: Tadiran=תדיראן, Electra=אלקטרה, Haier=האייר/הייר, Hisense=הייסנס, Philips=פיליפס/فيليبس, Braun=בראון/براون, Panasonic=פנסוניק/باناسونيك, Remington=רמינגטון, Babyliss=בייביליס, Andis=אנדיס, Sharp=שארפ, Midea=מידאה/מידיה, Bosch=בוש (also 'Bush' brand = בוש – ambiguous), Carrera=קררה, Sassonic=ססוניק, Gamma=גאמה, Hemilton=המילטון, Gold Line=גולד ליין, Moledet=מולדת, Omega=אומגה, Premier=פרמייר, Aiwa=איווה.
- 'מסלסל הפלא' (IRON KORNER) is a conical curling iron but sits in category 'מחליקי שיער'; the category aliases include מסלסל/curling iron so it is findable.
- S9502/83 is named 'סידרת 9400' in the catalog; Philips calls it 'Shaver Series 9000 / Shaver 9400'. Consider 'סידרת 9000 (9400)'.
- ATL-1606 name has a typo: 'מאוור' instead of 'מאוורר'.
- Catalog uses 'סידרת' and 'חרום' spellings; shoppers commonly type 'סדרת'/'סדרה' and 'חירום'.
- Catalog spells the mosquito category 'קטלן'; shoppers type 'קוטל יתושים'.
- 'פן' must map to מייבשי שיער, but 'פן מחליק' and 'פן חימום' are different (straightener/hot brush and fan heater) – apply the multi-word phrases before the single-word 'פן' rule.
- 'מזגנית' (SP2000C) means a small bathroom fan heater, not an AC – should not route to מזגנים. 'מזגן מים' means an evaporative air cooler (מצנני אוויר).
- Store has no oil radiators, kerosene heaters or fireplaces; 'רדיאטור'/'אויל'/'תנור נפט'/'קמין' are mapped to the general heater category (תנורי חימום) as the closest substitute.
- Electra 'A  INVERTER  240' and Philips 'Wet  Dry S7886-35' model numbers contain double spaces – normalise whitespace.
- 'אביזרים' is a catch-all (TV antenna + ironing board); a dedicated category name would help search.
- Midea model numbers include importer codes in parentheses, e.g. 'FS40-19M (6845)'; '(FS40-15F (6807' has a misplaced parenthesis.
- I did not add a product-level alias for the 'Carbon' chairs (DANI/ARCTIC): 'ארקטיק' and 'דני' would collide with other searches.

## g6-hot-drinks-shabbat-toasters

- Brand 'Hemilton Beach' (6 products) is a misspelling of Hamilton Beach (Hebrew: המילטון ביץ'). It is a different company from the Israeli house brand 'Hemilton' (HEM-xxx). Shoppers typing 'Hamilton Beach' may miss these; consider fixing the brand field in Base44.
- In Israel, 'טוסטר' on its own usually means a sandwich press (טוסטר לחיצה), while a pop-up bread toaster is 'מצנם' or 'טוסטר קופץ'. So 'טוסטר' is aliased to טוסטר גריל לחיצה, and 'טוסטר קופץ' / 'טוסטר לחם' map to מצנמים. Make sure a bare 'טוסטר' does not also rank טוסטר אובן above the press toasters.
- Many press-toaster names contain 'פלטות נשלפות' (removable plates), so a search for 'פלטה' / 'פלטות' can land on toasters instead of Shabbat hot plates. The phrase mappings send 'פלטה', 'פלאטה' and 'פלטה חשמלית' to 'פלטת שבת'.
- EN510 (Lattissima One) is a Nespresso machine, but its catalog name never says 'נספרסו', unlike the other De'Longhi Nespresso machines. Consider adding it to the name.
- Westinghouse WKCMX-02 takes Nespresso-compatible capsules according to the importer (Selmor), but the catalog name says only 'קפסולות'. Adding 'תואמת נספרסו' to the name would help search and set the right expectation.
- I could not tell which capsule system the Lorenzo MATEO-W / MATEO-B machines use, so they got no alias. The owner should add the capsule type (for example 'תואמת נספרסו') to the name if it is known.
- The catalog has no Dolce Gusto (דולצ'ה גוסטו) machines and no Shabbat timers (שעון שבת) in these categories, so I deliberately did not map those terms here. Mapping them to Nespresso-type machines or hot plates would mislead shoppers.
- The TOPSON Shabbat kettles (TP-892B/W, 'קומקום שבת') sit in קומקומים, but some shoppers will search 'מיחם שבת' for them. That phrase maps to מיחמים, so these two may not show up for it.
- Selmor SE-91 / SE-91B (electric Turkish-coffee finjan) is in מכונות קפה, and its name starts with 'הפינג'אן'. Terms like 'פינג'אן', 'ג'זווה' and 'קפה טורקי' are now covered as product aliases and phrases.
- No line names were found or added for the house brands (Sol exlusive, Gold Line, Hemilton, Sauter, Normande, S.A.P, Zaks, Luxor, Moledet, Selmor, TOPSON, ECOEURO, Benaton, Chromex, Graetz, Ufesa), for Westinghouse kettles, toasters and the automatic machine, or for Panasonic NC-DK1, Black+Decker, Midea, KitchenAid 5KEKL2221SOB (I could not confirm a public model or line name), Tefal KI840830, Bosch TSM6A01x / TCG33xx or DeLonghi KG79.

## g7-food-prep-fryers

- Air fryers are named 'סיר לטיגון באוויר חם' everywhere; the words 'אייר פרייר' never appear in the catalog. Consider adding 'אייר פרייר' to product names/descriptions too.
- Popcorn: catalog spells 'פופ קורן' (two words); shoppers almost always type 'פופקורן' (one word).
- Ninja products in this group: Crispi FN101/FN103, AF183 Max Pro, CREAMi NC303 and Swirl NC701, Blast Max BC251, Detect TB303, Twisti CB153, grills EG203/DG553/AG653, Woodfire OG850. No Ninja Foodi multi-cooker or Speedi is in this group's input, so 'נינג'ה פודי'/'ספידי' queries can only reach the Foodi-branded grills (EG203, DG553, AG653).
- 'MAX PRO' is used by two different Ninja products (AF183 air fryer and AG653 grill), so 'מקס פרו' will match both.
- Catalog typos: DG553 'סיר גרייל' (should be 'סיר גריל'); 5KHBL1321EOB 'בלנד מוט' (should be 'בלנדר מוט'); MSM6M810 'בלנדר מוט1200' (missing space); MUMS6ZS00 'קערה.55 ליטר' (Bosch says 5.5 L); 37571-S 'רב תכלתי' (should be 'רב תכליתי').
- MMB6176B/01: catalog says '120 וואט כוס פלסטיק 1.5 ליטר', but Bosch lists MMB6176B as a 1200 W VitaPower Series 4 with a ThermoSafe glass jug. Please check the wattage and jug material.
- Brand spelled 'Hemilton' / 'Hemilton Beach' in the catalog; shoppers type 'Hamilton' / 'המילטון'. This belongs in the brands group.
- Product 35036-IS is listed under brand 'Sol exlusive', but its '-IS' model format matches the Hamilton Beach importer codes (35014-IS, 35052-IS). The brand may be wrong.
- Generic words that are also brands: Israelis use 'מולינקס' for any mini chopper, 'קנווד' and 'קיטשן אייד' for any stand mixer, 'נוטריבולט' for any personal blender, 'מג'ימיקס' for food processors, and 'ויטמיקס' for high-power blenders. 'נוטריבולט', 'ויטמיקס' and 'קיטשן אייד' are mapped to categories here. 'מולינקס', 'קנווד' and 'מג'ימיקס' were left as brand searches because those brands are in the catalog.
- MC812M814 (Bosch) was not found online under that exact code; MC812 is the MultiTalent 8 prefix. NC303IS, TB303, EG203, DG553 and AG653 are Israel-only SKUs; their line names come from Israeli retailers and the closest international siblings (NC300, TB301, EG201, DG551, AG651).
- The 'מכשיר אפיה 4 צורות' products (ATL-2777, TX-209) got no aliases because I could not confirm which 4 plates they include.
