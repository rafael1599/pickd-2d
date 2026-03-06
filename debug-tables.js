
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const getEnvValue = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debug() {
    const { data, error } = await supabase.rpc('get_schema_info'); // If exists
    
    // Better: query pg_tables
    // We can't query pg_tables directly through PostgREST easily without an RPC.
    // But we can try to query a table that MUST exist.
    const { data: d2, error: e2 } = await supabase.from('locations').select('count');
    console.log("Locations count session:", d2?.length, e2?.message);
    
    const { data: d3, error: e3 } = await supabase.from('inventory').select('id').limit(1);
    console.log("Inventory existence check:", d3, e3?.message);
}
debug();
