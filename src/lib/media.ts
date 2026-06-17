/**
 * Resolves a stored media value (full URL or S3 key) to a browser-loadable URL.
 */
export function resolveMediaUrl(
  urlOrKey: string | null | undefined
): string | null {
  if (!urlOrKey?.trim()) return null;

  const value = urlOrKey.trim();
  if (/^https?:\/\//i.test(value)) return value;

  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
  const region = process.env.NEXT_PUBLIC_S3_REGION || "us-east-1";
  if (bucket) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${value.replace(/^\//, "")}`;
  }

  return value;
}

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
