// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://uccoutnavjleuilcxnns.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjY291dG5hdmpsZXVpbGN4bm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDg5OTYsImV4cCI6MjA2MTUyNDk5Nn0.Ebjoth7EehmU2mrUS67HSJG_GXxYyMyBL9pPSvtGQgw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);