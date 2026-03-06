import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const getEnvValue = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabase = createClient(
    getEnvValue('VITE_SUPABASE_URL'),
    getEnvValue('VITE_SUPABASE_ANON_KEY')
)

const TARGET_ROWS = ['ROW 1', 'ROW 2', 'ROW 3', 'ROW 4']

async function run() {
    console.log('=== Audit SKU Dimensions for Rows 1, 2, 3, 4 ===\n')

    // 1. Fetch inventory for rows 1-4
    const { data: invData, error: invErr } = await supabase
        .from('inventory')
        .select('sku, location, quantity')

    if (invErr) { console.error('FAIL:', invErr.message); return }

    // Group SKUs by row
    const rowSkus = {}
    TARGET_ROWS.forEach(r => { rowSkus[r] = [] })

    invData.forEach(item => {
        const loc = (item.location || '').trim().toUpperCase()
        if (TARGET_ROWS.includes(loc)) {
            rowSkus[loc].push({ sku: item.sku, qty: item.quantity })
        }
    })

    // Collect all unique SKUs
    const allSkus = new Set()
    Object.values(rowSkus).forEach(items => items.forEach(i => allSkus.add(i.sku)))

    // 2. Fetch metadata for these SKUs
    const { data: metaData, error: metaErr } = await supabase
        .from('sku_metadata')
        .select('sku, length_in, width_in, height_in')
        .in('sku', [...allSkus])

    if (metaErr) { console.error('FAIL:', metaErr.message); return }

    const metaMap = {}
    metaData.forEach(m => { metaMap[m.sku] = m })

    // 3. Report per row
    for (const row of TARGET_ROWS) {
        const items = rowSkus[row].sort((a, b) => b.qty - a.qty)
        console.log('--- ' + row + ' (' + items.length + ' SKUs) ---')

        items.forEach(item => {
            const meta = metaMap[item.sku]
            if (!meta) {
                console.log('  [NO METADATA] ' + item.sku + ' (qty: ' + item.qty + ')')
            } else {
                const L = meta.length_in
                const W = meta.width_in
                const H = meta.height_in
                const flag = (!L || !W || !H || L < 2 || W < 2) ? ' <-- SUSPECT' : ''
                console.log('  ' + item.sku + ': L=' + L + ' W=' + W + ' H=' + H + ' (qty: ' + item.qty + ')' + flag)
            }
        })
        console.log()
    }
}

run().catch(e => console.error('Fatal error:', e))
