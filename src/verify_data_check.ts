
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking Data Counts...');

    // 1. Total Count (No filters)
    const { count: total, error: err1 } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true });

    if (err1) {
        console.error('Error fetching total:', err1);
    } else {
        console.log('Total OS in DB:', total);
    }

    // 2. Data Distribution (Years)
    const { data: years, error: err2 } = await supabase
        .from('ordens_servico')
        .select('data_abertura');

    if (err2) {
        console.error('Error fetching dates:', err2);
    } else {
        const yearCounts: Record<string, number> = {};
        years?.forEach((os: any) => {
            if (os.data_abertura) {
                const y = new Date(os.data_abertura).getFullYear().toString();
                yearCounts[y] = (yearCounts[y] || 0) + 1;
            } else {
                yearCounts['null'] = (yearCounts['null'] || 0) + 1;
            }
        });
        console.log('OS Distribution by Year:', yearCounts);
    }

    // 3. User Check
    const { data: users, error: err3 } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, role')
        .limit(5);

    if (err3) {
        console.error('Error fetching profiles:', err3);
    } else {
        console.log('Sample Profiles:', users);
    }
}

checkData();
