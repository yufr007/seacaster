import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://vabaqkpslqyeipbssbin.supabase.co';
// Use the key extracted earlier (Anon Key)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhYmFxa3BzbHF5ZWlwYnNzYmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzY3NDUsImV4cCI6MjA4MDg1Mjc0NX0.oECLZLSlknr4fFpYCIemGkU4LGmh7es4-2oPlE2uJ_4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log(`Checking project status at ${supabaseUrl}...`);
    const start = Date.now();

    // Try a simple query
    const { data, error, status } = await supabase.from('User').select('*').limit(1);

    console.log('Status Code:', status);

    if (error) {
        console.error('Error:', error.message);
        if (error.message.includes('upstream service unavailable') || status === 503 || status === 500) {
            console.log('⚠️  Project might be PAUSED or restarting.');
        }
    } else {
        console.log('✅ Connected via REST API!');
        console.log('Data:', data);
    }
}

checkStatus();
