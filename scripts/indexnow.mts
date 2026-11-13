/**
 * Tells Bing (and every other IndexNow engine: Yandex, Seznam, Naver) that
 * URLs changed, instead of waiting for the next crawl.
 *
 * Bing Webmaster Tools showed no IndexNow activity and last read the sitemap
 * a week before this was written, while Copilot was citing the dimension
 * guides 30–46 times a day. Bing's index feeds Copilot and ChatGPT search, so
 * the time between an edit and Bing seeing it is the time an AI answer keeps
 * quoting the old page.
 *
 * The key is public by design: it lives at /8312aa25e2a7cf90cb7f37c5524bae50.txt so the
 * engines can verify the submitter owns the host. Submit only after a deploy
 * has made the changed pages (and the key file) live.
 *
 *   npm run indexnow -- /guides/oven-dimensions /recommended/65-inch-tvs
 *   npm run indexnow -- --sitemap            # every URL in the live sitemap
 *   npm run indexnow -- --dry-run /guides    # print, send nothing
 */
const HOST = "hadadelectric.co.il";
const ORIGIN = `https://${HOST}`;
const KEY = "8312aa25e2a7cf90cb7f37c5524bae50";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 10_000; // protocol maximum per request

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const useSitemap = args.includes("--sitemap");
const paths = args.filter((arg) => !arg.startsWith("--"));

async function sitemapUrls(): Promise<string[]> {
  const response = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!response.ok) throw new Error(`sitemap.xml returned ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, "&"));
}

function toUrl(input: string): string {
  const url = new URL(input, ORIGIN);
  if (url.host !== HOST) throw new Error(`${input} is not on ${HOST}`);
  url.protocol = "https:";
  return url.toString();
}

async function main() {
  const urls = [...new Set(useSitemap ? await sitemapUrls() : paths.map(toUrl))];
  if (urls.length === 0) {
    console.error("Nothing to submit. Pass paths, or --sitemap.");
    process.exit(1);
  }

  const keyCheck = await fetch(`${ORIGIN}/${KEY}.txt`);
  if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
    console.error(`The key file ${ORIGIN}/${KEY}.txt is not live yet — deploy first.`);
    process.exit(1);
  }

  for (let i = 0; i < urls.length; i += BATCH) {
    const urlList = urls.slice(i, i + BATCH);
    if (dryRun) {
      console.log(urlList.join("\n"));
      continue;
    }
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList }),
    });
    // 200 = accepted, 202 = accepted pending key validation; anything else is a refusal.
    console.log(`${urlList.length} URLs → HTTP ${response.status}${response.ok ? "" : ` ${await response.text()}`}`);
    if (!response.ok) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
