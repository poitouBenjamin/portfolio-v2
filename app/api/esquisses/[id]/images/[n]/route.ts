import { esquisseIdSchema } from "@/lib/previews/shared";
import { getEsquisse } from "@/lib/previews/store";

// Visuels envoyés par le client, affichés dans ses esquisses : l'identifiant de la fiche,
// impossible à deviner, suffit pour y accéder
export async function GET(_request: Request, { params }: RouteContext<"/api/esquisses/[id]/images/[n]">) {
  const { id, n } = await params;
  if (!esquisseIdSchema.safeParse(id).success) return new Response(null, { status: 404 });
  const image = (await getEsquisse(id))?.images[Number(n)];
  const match = image?.dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) return new Response(null, { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: { "Content-Type": match[1], "Cache-Control": "private, max-age=86400" },
  });
}
