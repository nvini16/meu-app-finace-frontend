import { createClient } from '@supabase/supabase-js';

// Usando o link do seu projeto e a chave que você copiou do site
const supabaseUrl = 'https://grpyxeepalighojfaoxf.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZdUKeOuW8OVc35PB2F3v1A_VPz1z_Hb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);