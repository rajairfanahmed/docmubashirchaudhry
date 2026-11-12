import crypto from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireR2Config, clampSignedUrlTtlSeconds, type R2Config } from '@/lib/env';

export const MAX_PDF_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB hard ceiling
export const UPLOAD_URL_TTL_SECONDS = 120; // 2 minutes for admin direct PUT upload

export function createR2S3Client(config: R2Config = requireR2Config()): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    // Required for Cloudflare R2 compatibility with AWS SDK v3 >= 3.729
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
  });
}

export function slugifyFilenameBase(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return cleaned || 'study-booklet';
}

export function sanitizeDownloadFilename(titleOrSlug: string): string {
  const base = titleOrSlug
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9 ._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  return `${base || 'docmubashirchaudhry-resource'}.pdf`;
}

export function isSafePdfObjectKey(fileKey: string): boolean {
  if (!fileKey || fileKey.length > 260) return false;
  if (fileKey.includes('..') || fileKey.startsWith('/') || fileKey.includes('\\')) {
    return false;
  }
  return /^pdfs\/[a-z0-9/_-]+\.pdf$/i.test(fileKey);
}

export function buildPdfObjectKey(titleOrFilename: string, now = new Date()): string {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const slug = slugifyFilenameBase(titleOrFilename);
  const id = crypto.randomUUID();
  return `pdfs/${year}/${month}/${id}-${slug}.pdf`;
}

export async function createPresignedPdfUploadUrl(options: {
  filename: string;
  contentType: string;
  fileSizeBytes: number;
  config?: R2Config;
}): Promise<{
  uploadUrl: string;
  fileKey: string;
  expiresInSeconds: number;
  requiredHeaders: Record<string, string>;
}> {
  if (options.contentType !== 'application/pdf') {
    throw new Error('Only application/pdf uploads are permitted.');
  }
  if (
    !Number.isFinite(options.fileSizeBytes) ||
    options.fileSizeBytes <= 0 ||
    options.fileSizeBytes > MAX_PDF_UPLOAD_BYTES
  ) {
    throw new Error(`PDF file size must be between 1 byte and ${MAX_PDF_UPLOAD_BYTES} bytes.`);
  }

  const config = options.config ?? requireR2Config();
  const client = createR2S3Client(config);
  const fileKey = buildPdfObjectKey(options.filename);

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: fileKey,
    ContentType: 'application/pdf',
    ContentLength: Math.floor(options.fileSizeBytes)
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS
  });

  return {
    uploadUrl,
    fileKey,
    expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
    requiredHeaders: {
      'Content-Type': 'application/pdf'
    }
  };
}

export async function createPresignedPdfDownloadUrl(options: {
  fileKey: string;
  downloadName: string;
  expiresInSeconds?: number;
  config?: R2Config;
}): Promise<{
  downloadUrl: string;
  expiresInSeconds: number;
  expiresAt: string;
}> {
  if (!isSafePdfObjectKey(options.fileKey)) {
    throw new Error('Invalid private PDF object key.');
  }

  const config = options.config ?? requireR2Config();
  const ttl = clampSignedUrlTtlSeconds(
    options.expiresInSeconds ?? config.signedUrlTtlSeconds
  );
  const client = createR2S3Client(config);
  const safeFilename = sanitizeDownloadFilename(options.downloadName);

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: options.fileKey,
    ResponseContentType: 'application/pdf',
    ResponseContentDisposition: `attachment; filename="${safeFilename}"`
  });

  const downloadUrl = await getSignedUrl(client, command, {
    expiresIn: ttl
  });

  return {
    downloadUrl,
    expiresInSeconds: ttl,
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
  };
}

export async function headPdfObject(options: {
  fileKey: string;
  config?: R2Config;
}): Promise<{ exists: boolean; contentLength: number | null; contentType: string | null }> {
  if (!isSafePdfObjectKey(options.fileKey)) {
    return { exists: false, contentLength: null, contentType: null };
  }

  const config = options.config ?? requireR2Config();
  const client = createR2S3Client(config);

  try {
    const result = await client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: options.fileKey
      })
    );
    return {
      exists: true,
      contentLength:
        typeof result.ContentLength === 'number' ? result.ContentLength : null,
      contentType: result.ContentType ?? null
    };
  } catch (error) {
    const statusCode =
      (error as { $metadata?: { httpStatusCode?: number }; name?: string })?.$metadata
        ?.httpStatusCode;
    const errorName = (error as { name?: string })?.name;
    if (statusCode === 404 || errorName === 'NotFound') {
      return { exists: false, contentLength: null, contentType: null };
    }
    throw error;
  }
}

export async function deletePdfObject(options: {
  fileKey: string;
  config?: R2Config;
}): Promise<void> {
  if (!isSafePdfObjectKey(options.fileKey)) {
    return;
  }
  const config = options.config ?? requireR2Config();
  const client = createR2S3Client(config);
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: options.fileKey
    })
  );
}

