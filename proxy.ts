import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Tout sauf les routes internes et les fichiers statiques (chemins contenant un point).
  // Double antislash : le point doit arriver échappé jusqu'à la regex, sinon `.*..*`
  // exclurait toute URL de plus d'un caractère.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
