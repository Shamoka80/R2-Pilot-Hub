(function () {
  const url = window.APP_CONFIG?.supabaseUrl;
  const key = window.APP_CONFIG?.supabaseAnonKey;

  if (!url || !key) {
    console.error("Supabase config is missing.");
    return;
  }

  window.sb = supabase.createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();
