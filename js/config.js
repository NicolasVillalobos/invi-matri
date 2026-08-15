/* =========================================================
   Configuración del sitio.
   Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY con los datos
   de tu proyecto:  Supabase → Project Settings → API
   =========================================================
   La anon key es pública por diseño: la seguridad la dan las
   políticas RLS de supabase/schema.sql (solo permiten INSERT,
   nunca leer lo que otros enviaron).
   ========================================================= */
window.APP_CONFIG = {
  SUPABASE_URL: "https://ybcntwylzkuggmhpwusv.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_PubM3j9Px4IlsOBm4GIOrg_xLKF-DE9",

  // Fecha y hora del matrimonio (zona horaria de Chile, -03:00 en verano)
  WEDDING_DATE: "2026-12-12T17:30:00-03:00"
};