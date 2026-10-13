import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import EsquissesView from "@/components/EsquissesView";
import { localePath, routing } from "@/i18n/routing";
import { brandOf, esquisseUrl, isAdmin } from "@/lib/esquisses/links";
import { present } from "@/lib/previews/lock";
import { paymentMode } from "@/lib/previews/payment";
import { esquisseIdSchema } from "@/lib/previews/shared";
import { getEsquisse } from "@/lib/previews/store";
import { profile } from "@/lib/site";

// Page privée d'un client : jamais indexée. Elle n'existe que si une fiche a été créée,
// donc pas besoin du drapeau des esquisses (le lien de l'email marche sur tous les appareils)
export async function generateMetadata({ params }: PageProps<"/[locale]/esquisses/[id]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale });
  return { title: t("Esquisses.metaTitle"), robots: { index: false, follow: false } };
}

export default async function EsquissesPage({ params, searchParams }: PageProps<"/[locale]/esquisses/[id]">) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale) || !esquisseIdSchema.safeParse(id).success) notFound();
  setRequestLocale(locale);

  const esquisse = await getEsquisse(id);
  if (!esquisse) notFound();
  const k = (await searchParams).k;
  const admin = isAdmin(id, typeof k === "string" ? k : null);
  // Le client voit sa page dès le premier email envoyé par Benjamin, même pendant une regénération
  if (!admin && !esquisse.sentAt) notFound();

  const t = await getTranslations();
  const brand = brandOf(esquisse);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-void via-void/70 to-transparent">
        <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-end px-4 sm:px-8">
          <a
            href={localePath(locale)}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:border-fog"
          >
            {profile.name} ↗
          </a>
        </div>
      </header>

      <main className="relative overflow-x-clip">
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-violet/20 blur-[140px]" />
        <div className="relative mx-auto max-w-[1400px] px-4 pt-36 pb-28 sm:px-8">
          <p className="font-mono text-sm text-acid">{t("Esquisses.eyebrow", { brand })}</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] font-bold tracking-[-0.04em] sm:text-7xl">
            {t("Esquisses.title")}{" "}
            <em className="font-serif font-normal tracking-normal text-acid">
              {t("Esquisses.titleAccent", { brand })}
            </em>
          </h1>
          <p className="mt-6 mb-14 max-w-2xl text-muted">{t("Esquisses.intro")}</p>

          <EsquissesView
            id={id}
            initialPreviews={admin ? esquisse.previews : present(esquisse.previews, esquisse.paid)}
            imageCount={esquisse.images.length}
            payment={paymentMode()}
            admin={
              admin
                ? {
                    key: k as string,
                    status: esquisse.status,
                    sentAt: esquisse.sentAt,
                    clientEmail: esquisse.brief.email,
                    clientUrl: esquisseUrl("", esquisse),
                  }
                : undefined
            }
          />

          <p className="mt-16 text-sm text-muted">{t("Esquisses.contact", { phone: profile.phone })}</p>
          <p className="mt-2 font-mono text-xs text-muted/70">{t("Esquisses.aiNote")}</p>
        </div>
      </main>
    </>
  );
}
