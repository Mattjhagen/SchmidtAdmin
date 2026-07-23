// Central Supabase connection constants.
//
// The project URL and anon key are PUBLIC by design — they ship in every
// browser bundle, and row-level security is the real protection. Hosting
// env vars for these values have repeatedly been corrupted by copy/paste
// (masked "•••" characters from the dashboard), which crashes fetch with
// "String contains non ISO-8859-1 code point". So: validate the env values
// and fall back to the known-good constants when they look wrong.
//
// The service role key is a genuine secret and has NO fallback here — it
// must come from the SUPABASE_SERVICE_ROLE_KEY env var (server only).

const FALLBACK_URL = 'https://hrrofmyuatuzjzrgyezo.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhycm9mbXl1YXR1emp6cmd5ZXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NjY1ODQsImV4cCI6MjEwMDI0MjU4NH0.5qaVxVlk-ICZZTiaEpnT-A9ywYiLdGilKd3eElex3Pw';

function cleanUrl(v: string | undefined): string | null {
  const s = (v ?? '').trim();
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(s) ? s : null;
}

// JWTs and sb_publishable_ keys are strictly ASCII: letters, digits, ., _, -
function cleanKey(v: string | undefined): string | null {
  const s = (v ?? '').trim();
  return s.length > 40 && /^[A-Za-z0-9._-]+$/.test(s) ? s : null;
}

export const SUPABASE_URL =
  cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? FALLBACK_URL;

export const SUPABASE_ANON_KEY =
  cleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? FALLBACK_ANON_KEY;

/** Server only. Returns null when unset or corrupted. */
export function getServiceRoleKey(): string | null {
  return cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
