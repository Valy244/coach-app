import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { SUPABASE_URL, SUPABASE_KEY } from "../config.js";

export const configured = !!(SUPABASE_URL && SUPABASE_KEY);
export const sb = configured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Client temporaire, utilisé par le coach pour créer le compte d'un client
// sans se déconnecter lui-même.
export function tempClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "coach-tmp-auth" },
  });
}

export function appUrl() {
  return location.origin + location.pathname.replace(/index\.html$/, "");
}
