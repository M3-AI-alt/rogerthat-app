import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const fallbackSupabaseUrl = "https://example.supabase.co";
const fallbackSupabaseAnonKey = "missing-supabase-anon-key";

function getUrlHost(url: string): string {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

export const supabaseConfig = {
  hasAnonKey: supabaseAnonKey.length > 0,
  hasUrl: supabaseUrl.length > 0,
  urlHost: getUrlHost(supabaseUrl),
};

export const supabase = createClient(
  supabaseUrl || fallbackSupabaseUrl,
  supabaseAnonKey || fallbackSupabaseAnonKey
);
