import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { getEnv } from "./env";

export const allowedMedia = new Map([
  ["video/mp4", "mp4"], ["video/quicktime", "mov"], ["video/webm", "webm"], ["audio/mpeg", "mp3"], ["audio/wav", "wav"], ["audio/x-wav", "wav"],
]);

export const createStorageClient = (publicEndpoint = false) => {
  const env = getEnv();
  return new S3Client({
    endpoint: publicEndpoint ? env.S3_PUBLIC_ENDPOINT ?? env.S3_ENDPOINT : env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  });
};

export function createUploadKey(projectId: string, mimeType: string) {
  const extension = allowedMedia.get(mimeType);
  if (!extension) throw new Error("Desteklenmeyen medya türü.");
  return `projects/${projectId}/original/${randomUUID()}.${extension}`;
}

export async function createPresignedUpload(key: string, mimeType: string, contentLength: number) {
  const env = getEnv();
  if (!allowedMedia.has(mimeType)) throw new Error("Desteklenmeyen medya türü.");
  if (contentLength <= 0 || contentLength > env.MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Dosya boyutu ${env.MAX_UPLOAD_MB} MB sınırını aşıyor.`);
  return getSignedUrl(createStorageClient(true), new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: mimeType, ContentLength: contentLength }), { expiresIn: 900 });
}

export async function createPresignedDownload(key: string) {
  const env = getEnv();
  return getSignedUrl(createStorageClient(true), new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }), { expiresIn: 900 });
}

export async function storageHealth() {
  const env = getEnv();
  await createStorageClient().send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  return true;
}
