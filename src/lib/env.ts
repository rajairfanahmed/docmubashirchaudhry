import { z } from 'zod';

const MIN_SIGNED_URL_TTL_SECONDS = 120;
const MAX_SIGNED_URL_TTL_SECONDS = 300;
const DEFAULT_SIGNED_URL_TTL_SECONDS = 180;

const OptionalNonEmpty = z.string().trim().min(1).optional();

const SupabasePublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: OptionalNonEmpty,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: OptionalNonEmpty
});

const SupabaseSecretEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
  SUPABASE_SECRET_KEY: OptionalNonEmpty,
  SUPABASE_SERVICE_ROLE_KEY: OptionalNonEmpty
});

const R2EnvSchema = z.object({
  CLOUDFLARE_R2_ACCOUNT_ID: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{8,64}$/, 'Invalid CLOUDFLARE_R2_ACCOUNT_ID'),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().trim().min(8),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().trim().min(16),
  CLOUDFLARE_R2_BUCKET_NAME: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/, 'Invalid CLOUDFLARE_R2_BUCKET_NAME')
});

export interface PublicSupabaseConfig {
  url: string;
  publishableKey: string;
}

export interface SecretSupabaseConfig {
  url: string;
  secretKey: string;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  signedUrlTtlSeconds: number;
}

export class BackendConfigError extends Error {
  readonly code = 'BACKEND_CONFIG_MISSING';

  constructor(message: string) {
    super(message);
    this.name = 'BackendConfigError';
  }
}

export function parsePublicSupabaseConfig(
  env: Record<string, string | undefined> = process.env
): PublicSupabaseConfig | null {
  const parsed = SupabasePublicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  if (!parsed.success) return null;
  const key =
    parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return null;

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, ''),
    publishableKey: key
  };
}

export function requirePublicSupabaseConfig(
  env: Record<string, string | undefined> = process.env
): PublicSupabaseConfig {
  const config = parsePublicSupabaseConfig(env);
  if (!config) {
    throw new BackendConfigError(
      'Supabase auth/public configuration is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  return config;
}

export function parseSecretSupabaseConfig(
  env: Record<string, string | undefined> = process.env
): SecretSupabaseConfig | null {
  const parsed = SupabaseSecretEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY
  });

  if (!parsed.success) return null;
  const secretKey =
    parsed.data.SUPABASE_SECRET_KEY ?? parsed.data.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) return null;

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, ''),
    secretKey
  };
}

export function requireSecretSupabaseConfig(
  env: Record<string, string | undefined> = process.env
): SecretSupabaseConfig {
  const config = parseSecretSupabaseConfig(env);
  if (!config) {
    throw new BackendConfigError(
      'Supabase server configuration is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.'
    );
  }
  return config;
}

export function clampSignedUrlTtlSeconds(rawValue?: string | number): number {
  const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_SIGNED_URL_TTL_SECONDS;
  }
  return Math.min(
    MAX_SIGNED_URL_TTL_SECONDS,
    Math.max(MIN_SIGNED_URL_TTL_SECONDS, Math.floor(numeric))
  );
}

export function parseR2Config(
  env: Record<string, string | undefined> = process.env
): R2Config | null {
  const parsed = R2EnvSchema.safeParse({
    CLOUDFLARE_R2_ACCOUNT_ID: env.CLOUDFLARE_R2_ACCOUNT_ID,
    CLOUDFLARE_R2_ACCESS_KEY_ID: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_BUCKET_NAME: env.CLOUDFLARE_R2_BUCKET_NAME
  });

  if (!parsed.success) return null;

  const accountId = parsed.data.CLOUDFLARE_R2_ACCOUNT_ID;
  return {
    accountId,
    accessKeyId: parsed.data.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: parsed.data.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucketName: parsed.data.CLOUDFLARE_R2_BUCKET_NAME,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    signedUrlTtlSeconds: clampSignedUrlTtlSeconds(
      env.CLOUDFLARE_R2_SIGNED_URL_TTL_SECONDS
    )
  };
}

export function requireR2Config(
  env: Record<string, string | undefined> = process.env
): R2Config {
  const config = parseR2Config(env);
  if (!config) {
    throw new BackendConfigError(
      'Cloudflare R2 private storage configuration is incomplete. Set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME.'
    );
  }
  return config;
}

export function getAdminAllowList(
  env: Record<string, string | undefined> = process.env
): Set<string> {
  const raw = env.ADMIN_EMAILS ?? '';
  const unwrapped = raw.trim().replace(/^(['"])(.*)\1$/, '$2');
  const emails = unwrapped
    .split(/[,;\n]+/)
    .map((item) => item.trim().replace(/^['"]|['"]$/g, '').toLowerCase())
    .filter((item) => item.includes('@') && item.length >= 5);
  return new Set(emails);
}

export function isAdminEmail(
  email: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const allowList = getAdminAllowList(env);
  return allowList.has(normalized);
}

export function getV3RuntimeReadiness(
  env: Record<string, string | undefined> = process.env
): {
  supabasePublicConfigured: boolean;
  supabaseSecretConfigured: boolean;
  r2Configured: boolean;
  adminAllowListConfigured: boolean;
} {
  return {
    supabasePublicConfigured: parsePublicSupabaseConfig(env) !== null,
    supabaseSecretConfigured: parseSecretSupabaseConfig(env) !== null,
    r2Configured: parseR2Config(env) !== null,
    adminAllowListConfigured: getAdminAllowList(env).size > 0
  };
}

