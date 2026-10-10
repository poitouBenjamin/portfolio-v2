import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Interactions from "@/components/Interactions";
import { profile } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
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

const title = `${profile.name} · ${profile.title}`;

export const metadata: Metadata = {
  title,
  description: profile.tagline,
  openGraph: { title, description: profile.tagline, type: "website" },
};

export const viewport: Viewport = { themeColor: "#08080a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <div className="grain" aria-hidden="true" />
        <Interactions />
      </body>
    </html>
  );
}
