import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter_Tight, Instrument_Serif, JetBrains_Mono, Manrope } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Interactions from "@/components/Interactions";
import { routing } from "@/i18n/routing";
import "../globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-inter-tight",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale });

  return {
    title: t("Metadata.title"),
    description: t("Metadata.description"),
    openGraph: {
      title: t("Metadata.title"),
      description: t("Metadata.description"),
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export const viewport: Viewport = { themeColor: "#08080a" };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${manrope.variable} ${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <div className="grain" aria-hidden="true" />
        <Interactions />
      </body>
    </html>
  );
}
