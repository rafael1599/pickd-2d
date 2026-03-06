
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const getEnvValue = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY')

console.log("Connecting to:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verify() {
    // Check tables
    const { data: tables, error: e1 } = await supabase.rpc('get_tables_count'); // Custom RPC if exists
    // Fallback: simple query
    const { count, error } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });
        
    if (error) {
        console.error("Error querying inventory:", error.message);
    } else {
        console.log("Total rows in inventory:", count);
    }
    
    const { data: sample } = await supabase
        .from('inventory')
        .select('location, sku, quantity')
        .limit(5);
    console.log("Sample Data:", sample);
    
    const { data: bay3 } = await supabase
        .from('inventory')
        .select('location, sku, quantity')
        .ilike('location', 'ROW 2%')
        .limit(10);
    console.log("Bay 3 (Row 2x) Data:", bay3);
}

verify();
