// Build-time env vars replaced by webpack DefinePlugin — these never exist
// at runtime in the Figma sandbox/iframe, so only exact `process.env.X`
// member expressions (which DefinePlugin rewrites) are safe to use
declare var process: {
    env: {
        API_BASE_URL?: string;
        SUPABASE_URL?: string;
        SUPABASE_ANON_KEY?: string;
    };
};
