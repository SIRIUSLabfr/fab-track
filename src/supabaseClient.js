import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "Supabase-Konfiguration fehlt. Lege VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env (lokal) bzw. in den Netlify-Umgebungsvariablen an."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", key || "placeholder");
