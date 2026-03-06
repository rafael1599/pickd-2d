import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const getEnvValue = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
    try {
        const { data: q } = await supabase
            .from('inventory')
            .select('location, sku, quantity')
            .ilike('location', 'ROW 20')
            
        console.log("Check for Row 20:", q)
        
        const { data: q2 } = await supabase
            .from('inventory')
            .select('location, sku, quantity')
            .ilike('location', 'ROW 21')
            
        console.log("Check for Row 21:", q2)

        const { data: all } = await supabase
            .from('inventory')
            .select('location')
            .limit(100)
            
        const uniqueLocs = [...new Set(all.map(i => i.location))]
        console.log("Unique location samples in DB:", uniqueLocs.slice(0, 20))
        
    } catch (e) {
        console.error("Execution failed:", e.message)
    }
}

check();
