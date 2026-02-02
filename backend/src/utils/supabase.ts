// utils/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return { supabaseUrl, supabaseServiceKey, supabaseAnonKey };
};

// Lazy initialization - only create when accessed
let _supabaseAdmin: SupabaseClient | null = null;

// Create admin client (for server-side operations)
export const supabaseAdmin = (): SupabaseClient => {
    if (!_supabaseAdmin) {
        const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();
        _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return _supabaseAdmin;
};

// Create a client with a specific user's JWT (for authenticated requests)
export const createServerSupabaseClient = (accessToken?: string): SupabaseClient => {
    const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();
    
    const options = accessToken
        ? {
              global: {
                  headers: {
                      Authorization: `Bearer ${accessToken}`,
                  },
              },
              auth: {
                  autoRefreshToken: false,
                  persistSession: false,
              },
          }
        : {
              auth: {
                  autoRefreshToken: false,
                  persistSession: false,
              },
          };

    return createClient(supabaseUrl, supabaseServiceKey, options);
};

// For testing purposes or if needed on the server
export const createAnonSupabaseClient = (): SupabaseClient => {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    if (!supabaseAnonKey) {
        throw new Error('SUPABASE_ANON_KEY is required for anonymous client');
    }
    return createClient(supabaseUrl, supabaseAnonKey);
};
