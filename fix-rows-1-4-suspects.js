import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const getEnvValue = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabase = createClient(
    getEnvValue('VITE_SUPABASE_URL'),
    getEnvValue('VITE_SUPABASE_ANON_KEY')
)

const TARGET_ROWS = ['ROW 1', 'ROW 2', 'ROW 3', 'ROW 4']
const TARGET_DIMS = { length_in: 54, width_in: 8, height_in: 30 }

async function run() {
    console.log('=== Fix Suspicious SKU Dimensions in Rows 1-4 ===\n')

    // 1. Fetch inventory to find SKUs in rows 1-4
    const { data: invData, error: invErr } = await supabase
        .from('inventory')
        .select('sku, location')

    if (invErr) { console.error('FAIL fetch inventory:', invErr.message); return }

    const skusInRows1234 = new Set()
    invData.forEach(item => {
        const loc = (item.location || '').trim().toUpperCase()
        if (TARGET_ROWS.includes(loc)) {
            skusInRows1234.add(item.sku)
        }
    })

    if (skusInRows1234.size === 0) {
        console.log('No SKUs found in target rows.');
        return;
    }

    // 2. Fetch current metadata for those SKUs
    const { data: metaData, error: metaErr } = await supabase
        .from('sku_metadata')
        .select('sku, length_in, width_in, height_in')
        .in('sku', [...skusInRows1234])

    if (metaErr) { console.error('FAIL fetch metadata:', metaErr.message); return }

    // 3. Filter for suspects
    // Definition of suspect: L < 20 or W < 5 or H < 5 or any is null/0
    const suspects = metaData.filter(m => {
        const L = m.length_in || 0;
        const W = m.width_in || 0;
        const H = m.height_in || 0;
        return L < 20 || W < 5 || H < 10 || !m.length_in || !m.width_in || !m.height_in;
    });

    console.log(`Found ${metaData.length} SKUs in Rows 1-4 metadata.`)
    console.log(`Identified ${suspects.length} suspect SKUs.\n`)

    if (suspects.length === 0) {
        console.log('No suspect SKUs found.');
        return;
    }

    console.log('-- Proposed Updates --')
    suspects.forEach(s => {
        console.log(`  ${s.sku}: (${s.length_in}x${s.width_in}x${s.height_in}) -> (54x8x30)`)
    })
    console.log()

    // 4. Update suspects
    let count = 0;
    for (const s of suspects) {
        const { error } = await supabase
            .from('sku_metadata')
            .update(TARGET_DIMS)
            .eq('sku', s.sku)
        
        if (error) {
            console.error(`  FAIL update ${s.sku}:`, error.message)
        } else {
            count++;
        }
    }

    console.log(`\n=== DONE ===`)
    console.log(`Updated ${count} suspect SKUs to 54x8x30.`)
}

run().catch(e => console.error('Fatal error:', e))
