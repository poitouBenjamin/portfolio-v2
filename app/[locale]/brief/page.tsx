import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import BriefForm from "@/components/BriefForm";
import { previewsEnabled } from "@/lib/previews/flag";
import { paymentMode } from "@/lib/previews/payment";
import { localePath, routing } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/brief">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t("Brief.metaTitle"), description: t("Brief.metaDescription") };
}

export default function BriefPage({ params }: PageProps<"/[locale]/brief">) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations();
  const home = localePath(locale);
  const otherLocale = routing.locales.find((l) => l !== locale)!;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-void via-void/70 to-transparent">
        <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-end gap-6 px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <a
              href={localePath(otherLocale, "/brief")}
              hrefLang={otherLocale}
              lang={otherLocale}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 font-mono text-xs font-medium uppercase transition hover:border-acid hover:text-acid"
            >
              {otherLocale}
            </a>
            <a
              href={home}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:border-fog"
            >
              ← {t("Brief.back")}
            </a>
          </div>
        </div>
      </header>

      <main className="relative overflow-x-clip">
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-violet/20 blur-[140px]" />
        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-4 pt-36 pb-28 sm:px-8 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div className="lg:sticky lg:top-36 lg:self-start">
            <p className="font-mono text-sm text-acid">{t("Brief.eyebrow")}</p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] font-bold tracking-[-0.04em] sm:text-7xl">
              {t("Brief.title")}{" "}
              <em className="font-serif font-normal tracking-normal text-acid">{t("Brief.titleAccent")}</em>
            </h1>
            <p className="mt-6 max-w-md text-muted">{t("Brief.intro")}</p>
          </div>
          <BriefForm
            homeHref={home}
            withPreview={previewsEnabled()}
            devFill={process.env.VERCEL_ENV !== "production"}
            payment={paymentMode()}
          />
        </div>
      </main>
    </>
  );
}
