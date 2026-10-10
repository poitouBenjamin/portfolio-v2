import type { routing } from "@/i18n/routing";
import type messages from "@/messages/fr.json";

// Clés de traduction et locales typées partout dans l'app
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
