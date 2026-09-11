export type MediaKind = "image" | "document" | "video" | "fallback";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "avif", "gif", "svg", "bmp", "ico"];
const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov", "m4v"];
const DOC_EXTS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "odt",
  "ods",
];

export function mediaExtension(media: any): string {
  if (!media || typeof media !== "object") return "";

  const source = media.ext || media.url || "";
  const raw = String(source).split("?")[0].split(".").pop() || "";
  return raw.replace(/^\./, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Classifies a Strapi media object into a presentation kind.
 *
 * MIME type is the primary signal; file extension is used only as a fallback
 * when MIME is unavailable.
 */
export function detectMediaKind(media: any): MediaKind {
  if (!media || typeof media !== "object") return "fallback";

  const mime = typeof media.mime === "string" ? media.mime.toLowerCase() : "";

  if (mime) {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf") return "document";
    if (mime === "application/msword") return "document";
    if (mime === "application/rtf") return "document";
    if (mime.startsWith("application/vnd.openxmlformats-officedocument.")) return "document";
    if (mime.startsWith("application/vnd.ms-")) return "document";
    if (mime.startsWith("application/vnd.oasis.opendocument.")) return "document";
    if (mime.startsWith("text/")) return "document";
    return "fallback";
  }

  const ext = mediaExtension(media);
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (DOC_EXTS.includes(ext)) return "document";
  return "fallback";
}

export function mediaLabel(media: any): string {
  if (!media || typeof media !== "object") return "File";

  const kind = detectMediaKind(media);
  const ext = mediaExtension(media).toUpperCase();

  if (kind === "video") return "Video";
  if (kind === "document") return ext || "Document";
  if (kind === "image") return ext || "Image";
  return "File";
}
