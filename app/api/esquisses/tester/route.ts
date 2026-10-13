import { isTesterToken, TESTER_COOKIE, testerCookieValue } from "@/lib/previews/flag";

const NINETY_DAYS_S = 90 * 24 * 60 * 60;

// Mode testeur : /api/esquisses/tester?k=<BRIEF_TESTER_TOKEN> active les esquisses en production
// pour ce navigateur seulement ; /api/esquisses/tester?off les désactive.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const headers = new Headers({ "Cache-Control": "no-store" });

  if (url.searchParams.has("off")) {
    headers.append("Set-Cookie", `${TESTER_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
    headers.set("Location", "/");
    return new Response(null, { status: 303, headers });
  }

  const value = testerCookieValue();
  if (!value || !isTesterToken(url.searchParams.get("k"))) return new Response(null, { status: 404, headers });

  headers.append(
    "Set-Cookie",
    `${TESTER_COOKIE}=${value}; Path=/; Max-Age=${NINETY_DAYS_S}; HttpOnly; Secure; SameSite=Lax`,
  );
  headers.set("Location", "/brief");
  return new Response(null, { status: 303, headers });
}
