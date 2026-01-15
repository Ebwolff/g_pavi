
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ifhzanrbynfcdszahsaj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmaHphbnJieW5mY2RzemFoc2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDg2MjEsImV4cCI6MjA4MzMyNDYyMX0.B4t9t5hoOxJ0nbCw8DVbQAcJsQEXKfo6HrWNGOVLGQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Supabase Data ---');

    const { count: total, error: errTotal } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true });

    if (errTotal) {
        console.error('Error fetching total:', errTotal);
        return;
    }
    console.log('Total OS:', total);

    // Check 2025+
    const { count: count2025 } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true })
        .gte('data_abertura', '2025-01-01T00:00:00Z');

    console.log('OS since 2025-01-01:', count2025);

    // Check 2024+
    const { count: count2024 } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true })
        .gte('data_abertura', '2024-01-01T00:00:00Z');

    console.log('OS since 2024-01-01:', count2024);

    // Check 2023+
    const { count: count2023 } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true })
        .gte('data_abertura', '2023-01-01T00:00:00Z');

    console.log('OS since 2023-01-01:', count2023);

    // Profiles check
    const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    console.log('Total Profiles:', profilesCount);
}

check();
