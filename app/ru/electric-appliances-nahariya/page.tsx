import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/base44/catalog";
import { localizeCategoryName } from "@/lib/i18n/translated";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/JsonLd";
import { localBusinessJsonLd, faqJsonLd } from "@/lib/schema/jsonld";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PhoneButton } from "@/components/PhoneButton";
import { BUSINESS } from "@/lib/utils";

/**
 * The Russian shop page for Nahariya.
 *
 * Russian-speaking demand on this site is real, local and already ranking:
 * "стиральная машина с сушкой купить в израиле" sits at position 9.97,
 * "напольный кондиционер купить в израиле" at 8.59, "паровой утюг купить в
 * израиле" at 10.44 — all with buying intent, all with zero clicks, because
 * the only Russian pages were the catalog and the guides. There was no
 * Russian page that says where the shop is, what it delivers and how to reach
 * a person who speaks the language.
 *
 * `LocalAreaPageContent` could not be reused: its chrome is hard-coded Hebrew
 * prose, and wrapping Russian copy in Hebrew section headings is exactly the
 * mixed-language page the translation policy in `lib/i18n/translated.ts`
 * exists to prevent.
 *
 * Every fact here is carried over from the Hebrew page in
 * `content/localPages.core.ts` — the street, the walking distance to Ga'aton
 * Boulevard, the sea humidity driving air-conditioner and dryer demand, the
 * old railway-block kitchens that need exact fridge measurements. Nothing is
 * invented for the translation.
 */

const FAQ = [
  {
    question: "Вы говорите по-русски?",
    answer:
      "Да. В магазине вас обслужат по-русски — можно прийти лично, позвонить или написать в WhatsApp на русском языке.",
  },
  {
    question: "Где находится магазин?",
    answer:
      "Улица Лохамей ха-Гетаот 3, Нагария — в нескольких минутах пешком от бульвара Гаатон и центра города. Рядом есть парковка.",
  },
  {
    question: "Вы доставляете за пределы Нагарии?",
    answer:
      "Да. Мы доставляем и устанавливаем по всему северу Израиля — Акко, Крайот, Хайфа, Кармиэль, Маалот-Таршиха, Шломи, Назарет, Цфат, Тверия, Кацрин и окрестности. Точные сроки и стоимость доставки уточняйте при заказе.",
  },
  {
    question: "Почему на сайте нет цен?",
    answer:
      "Мы называем цену лично — так мы можем учесть конкретную модель, комплект техники, доставку и установку. Напишите нам модель или то, что вам нужно, и мы ответим с ценой и реальным наличием.",
  },
  {
    question: "Можно ли забрать товар самому?",
    answer:
      "Конечно. Самовывоз из магазина в Нагарии возможен всегда — напишите заранее, и мы подготовим товар к вашему приезду.",
  },
];

const WHATSAPP_MESSAGE =
  "Здравствуйте! Пишу с сайта. Интересует бытовая техника — подскажите, пожалуйста, наличие и цену.";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = buildMetadata({
  title: `Бытовая техника в Нагарии — магазин ${BUSINESS.nameEn}`,
  description:
    "Магазин бытовой техники в Нагарии, улица Лохамей ха-Гетаот 3. Холодильники, стиральные машины, кондиционеры, телевизоры. Обслуживание по-русски, доставка и установка по всему северу Израиля.",
  path: "/ru/electric-appliances-nahariya",
  locale: "ru",
  absoluteTitle: true,
  translations: {
    he: "/electric-appliances-nahariya",
    ru: "/ru/electric-appliances-nahariya",
  },
});

export default async function Page() {
  const categories = await getCategories();
  const featured = categories.filter((c) => c.productCount >= 3).slice(0, 8);

  return (
    <div lang="ru" dir="ltr">
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ)} />

      <div className="container-page py-10 pb-12 md:py-12 md:pb-16">
        <h1 className="text-2xl font-bold text-graphite md:text-4xl">
          Бытовая техника в Нагарии — наш магазин в центре города
        </h1>

        <div className="mt-5 flex max-w-3xl flex-col gap-4 text-[15px] leading-relaxed text-graphite-soft/85 md:text-base">
          <p>
            Hadad Yuval Electric — это магазин бытовой техники в Нагарии на улице Лохамей ха-Гетаот 3,
            в нескольких минутах пешком от бульвара Гаатон и центра города. К нам приходят жители
            старых кварталов, района Эйн-Сара, южной Нагарии и новых районов на востоке — и приезжают
            со всего севера.
          </p>
          <p>
            Как местный магазин, мы хорошо знаем квартиры Нагарии изнутри: кухни в старых
            «железнодорожных» домах, куда холодильник входит только в точных размерах; новые квартиры
            в проектах реновации со встроенными нишами; частные дома на севере города, где нужен
            большой холодильник для семьи. Близость моря тоже делает своё — из-за высокой влажности
            почти круглый год кондиционеры и сушильные машины у наших покупателей в числе самых
            востребованных.
          </p>
          <p>
            Нас ищут по-разному — «магазин бытовой техники», «магазин электроники», «где купить
            холодильник в Израиле». Это один и тот же магазин: крупная бытовая техника для дома —
            холодильники, стиральные и сушильные машины, кондиционеры, духовые шкафы — вместе с
            телевизорами и мелкой техникой, всё под одной крышей.
          </p>
          <p>
            На сайте можно посмотреть каталог и общее наличие, а дальше — зайти к нам в магазин или
            закрыть вопрос в WhatsApp, не выходя из дома. Мы отвечаем по-русски.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-line bg-brand-blue-light px-5 py-5 md:mt-10">
          <h2 className="text-base font-bold text-graphite md:text-lg">Напишите нам — ответим по-русски</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-graphite-soft/85">
            Пришлите модель, размеры ниши или просто опишите, что нужно. Мы проверим реальное наличие
            и ответим с ценой.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton message={WHATSAPP_MESSAGE} label="Написать в WhatsApp" trackAs="whatsapp_click_product" />
            <PhoneButton phone={BUSINESS.phoneDisplay} label="Позвонить в магазин" />
          </div>
        </section>

        {featured.length > 0 && (
          <section className="mt-10 md:mt-14" aria-labelledby="ru-nahariya-categories">
            <h2 id="ru-nahariya-categories" className="text-lg font-bold text-graphite md:text-2xl">
              Что можно купить у нас
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {featured.map((category) => (
                <Link
                  key={category.slug}
                  href={`/ru/categories/${category.slug}`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-graphite hover:border-brand-blue/40 hover:text-brand-blue"
                >
                  {localizeCategoryName(category.slug, category.name, "ru") ?? category.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 md:mt-14" aria-labelledby="ru-nahariya-visit">
          <h2 id="ru-nahariya-visit" className="text-lg font-bold text-graphite md:text-2xl">
            Как нас найти
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm">
              <dt className="text-graphite-soft/60">Адрес</dt>
              <dd className="mt-0.5 font-medium text-graphite">Лохамей ха-Гетаот 3, Нагария</dd>
            </div>
            <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm">
              <dt className="text-graphite-soft/60">Телефон</dt>
              <dd className="mt-0.5 font-medium text-graphite" dir="ltr">
                {BUSINESS.phoneDisplay}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm">
            <Link href="/ru/contact" className="font-semibold text-brand-blue hover:underline">
              Часы работы и карта
            </Link>
          </p>
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="ru-nahariya-faq">
          <h2 id="ru-nahariya-faq" className="text-lg font-bold text-graphite md:text-2xl">
            Частые вопросы
          </h2>
          <dl className="mt-4 flex flex-col gap-3">
            {FAQ.map((item) => (
              <div key={item.question} className="rounded-2xl border border-line bg-white px-4 py-3">
                <dt className="text-sm font-semibold text-graphite">{item.question}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-graphite-soft/85">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 md:mt-14" aria-labelledby="ru-nahariya-area">
          <h2 id="ru-nahariya-area" className="text-lg font-bold text-graphite md:text-2xl">
            Доставка по северу Израиля
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-graphite-soft/85">
            Мы доставляем и устанавливаем технику в Нагарии, Акко, Крайот, Хайфе, Кармиэле,
            Маалот-Таршихе, Шломи, Назарете, Цфате, Тверии, Кацрине и других городах севера.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/ru/delivery" className="font-semibold text-brand-blue hover:underline">
              Подробнее о доставке и установке
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
