import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

export interface UploadResult {
  key: string;
  url: string;
}

const bucket = process.env.S3_BUCKET!;
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY!;
const secretAccessKey = process.env.S3_SECRET_KEY!;
const forcePathStyle =
  String(process.env.S3_FORCE_PATH_STYLE || "false") === "true";

function extFrom(filename: string, mimetype: string) {
  if (filename.includes(".")) return filename.split(".").pop() || "bin";
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/jpeg") return "jpg";
  if (mimetype === "image/webp") return "webp";
  if (mimetype === "image/gif") return "gif";
  if (mimetype === "video/mp4") return "mp4";
  if (mimetype === "video/webm") return "webm";
  if (mimetype === "video/quicktime") return "mov";
  return "bin";
}

function streamToNodeReadable(stream: NodeJS.ReadableStream): Readable {
  return stream as Readable;
}

export class S3Storage {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }

  toPublicUrl(keyOrUrl: string) {
    if (/^https?:\/\//i.test(keyOrUrl)) return keyOrUrl;
    return `https://${bucket}.s3.${region}.amazonaws.com/${keyOrUrl}`;
  }

  isManagedUrl(keyOrUrl: string) {
    if (!keyOrUrl) return false;
    if (!/^https?:\/\//i.test(keyOrUrl)) return true;
    return keyOrUrl.startsWith(
      `https://${bucket}.s3.${region}.amazonaws.com/`
    );
  }

  async upload({
    filename,
    mimetype,
    stream,
  }: {
    filename: string;
    mimetype: string;
    stream: NodeJS.ReadableStream;
  }): Promise<UploadResult> {
    const ext = extFrom(filename, mimetype);
    const base = path
      .basename(filename, path.extname(filename))
      .replace(/[^a-zA-Z0-9-_]/g, "");
    const key = `uploads/${Date.now()}-${randomUUID()}-${
      base || "file"
    }.${ext}`;

    const uploader = new Upload({
      client: this.client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: streamToNodeReadable(stream),
        ContentType: mimetype,
      },
    });

    await uploader.done();

    return {
      key,
      url: this.toPublicUrl(key),
    };
  }

  async delete(keyOrUrl: string) {
    if (!this.isManagedUrl(keyOrUrl)) return;

    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
    const key = /^https?:\/\//i.test(keyOrUrl)
      ? keyOrUrl.replace(prefix, "")
      : keyOrUrl;

    if (!key) return;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  }
}
