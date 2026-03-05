import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Fetching all ordens_servico to see what exists...');
    const { data: all, error: errAll } = await supabase
        .from('ordens_servico')
        .select('id, numero_os, tipo_os, consultor_id, status_atual')
        .limit(10);

    if (errAll) {
        console.error('Error fetching all:', errAll);
    } else {
        console.log('Total returned:', all?.length);
        console.log('First few:', all);
    }

    console.log('\nTesting the OR query...');
    // simulating a random UUID for consultor_id to test syntax
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const tipo = 'GARANTIA';
    const { data: orData, error: orErr } = await supabase
        .from('ordens_servico')
        .select('id, numero_os, tipo_os, consultor_id')
        .or(`consultor_id.eq.${fakeId},tipo_os.eq.${tipo}`)
        .limit(5);

    if (orErr) {
        console.error('Error with OR syntax:', orErr);
    } else {
        console.log('OR query returned:', orData?.length);
        console.log('Data:', orData);
    }
}

testQuery();
