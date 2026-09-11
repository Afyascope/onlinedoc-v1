import { getPrivateR2Object, privateProductStorageConfigured } from "@/lib/storage/product-files";

export async function GET(
  _request: Request,
  { params }: { params: { key: string[] } },
) {
  if (!privateProductStorageConfigured()) return new Response("Not found", { status: 404 });
  const key = params.key.join("/");
  const object = await getPrivateR2Object(key);
  const contentType = object?.ContentType;
  if (!object?.Body || !contentType?.match(/^(image|video)\//)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(object.Body.transformToWebStream() as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
