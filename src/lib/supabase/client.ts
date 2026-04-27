import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey =
  "sb_publishable_placeholder_for_build_only_000000000000";

function getParsedUrl(url: string): URL | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url);
  } catch {
    return null;
  }
}

const parsedSupabaseUrl = getParsedUrl(supabaseUrl);
const hasValidSupabaseUrl = Boolean(parsedSupabaseUrl);
const hasSupabaseAnonKey = supabaseAnonKey.length > 0;

export const supabaseConfig = {
  hasAnonKey: hasSupabaseAnonKey,
  hasUrl: hasValidSupabaseUrl,
  urlHost: parsedSupabaseUrl?.host ?? "",
};

export const supabase = createClient(
  hasValidSupabaseUrl ? supabaseUrl : fallbackSupabaseUrl,
  hasSupabaseAnonKey ? supabaseAnonKey : fallbackSupabaseAnonKey
);
