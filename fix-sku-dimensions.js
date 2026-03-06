import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const getEnvValue = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabase = createClient(
    getEnvValue('VITE_SUPABASE_URL'),
    getEnvValue('VITE_SUPABASE_ANON_KEY')
)

const EXCLUDED_ROWS = ['ROW 1', 'ROW 2', 'ROW 3', 'ROW 4']
const TARGET_DIMS = { length_in: 54, width_in: 8, height_in: 30 }

async function run() {
    console.log('=== SKU Dimensions Fix Script (FORCE MODE) ===')
    console.log('Target: L=54, W=8, H=30 for all non-Row 1/2/3/4 SKUs\n')

    // 1. Fetch all inventory
    const { data: allInv, error: invErr } = await supabase
        .from('inventory')
        .select('sku, location')

    if (invErr) { console.error('FAIL fetch inventory:', invErr.message); return }

    const targetSkus = new Set()
    const excludedSkus = new Set()

    allInv.forEach(item => {
        const loc = (item.location || '').trim().toUpperCase()
        if (EXCLUDED_ROWS.includes(loc)) {
            excludedSkus.add(item.sku)
        } else {
            targetSkus.add(item.sku)
        }
    })

    // SKUs ONLY in non-excluded rows (don't touch ones shared with rows 1-4)
    const safeSkus = [...targetSkus].filter(sku => !excludedSkus.has(sku))

    console.log('Total unique SKUs in non-excluded rows: ' + targetSkus.size)
    console.log('SKUs also in rows 1-4 (skipped):       ' + (targetSkus.size - safeSkus.length))
    console.log('SKUs to force-update:                   ' + safeSkus.length + '\n')

    if (safeSkus.length === 0) { console.log('Nothing to update.'); return }

    // 2. Check what currently exists
    const { data: existingMeta, error: metaErr } = await supabase
        .from('sku_metadata')
        .select('sku, length_in, width_in, height_in')
        .in('sku', safeSkus)

    if (metaErr) { console.error('FAIL fetch metadata:', metaErr.message); return }

    const existingMap = {}
    existingMeta.forEach(m => { existingMap[m.sku] = m })

    // Show sample of what will change
    const toUpdate = []
    const toInsert = []
    const alreadyMatch = []

    for (const sku of safeSkus) {
        const existing = existingMap[sku]
        if (!existing) {
            toInsert.push({ sku, ...TARGET_DIMS })
        } else if (existing.length_in === TARGET_DIMS.length_in && 
                   existing.width_in === TARGET_DIMS.width_in && 
                   existing.height_in === TARGET_DIMS.height_in) {
            alreadyMatch.push(sku)
        } else {
            toUpdate.push({ sku, old: existing })
        }
    }

    console.log('Breakdown:')
    console.log('  Already at target (54x8x30): ' + alreadyMatch.length)
    console.log('  Need UPDATE (different dims): ' + toUpdate.length)
    console.log('  Need INSERT (no metadata):    ' + toInsert.length + '\n')

    // Show first 15 changes as preview
    if (toUpdate.length > 0) {
        console.log('-- Sample Updates (first 15) --')
        toUpdate.slice(0, 15).forEach(u => {
            console.log('  ' + u.sku + ': (' + u.old.length_in + 'x' + u.old.width_in + 'x' + u.old.height_in + ') -> (54x8x30)')
        })
        if (toUpdate.length > 15) console.log('  ... and ' + (toUpdate.length - 15) + ' more')
        console.log()
    }

    // 3. Execute force updates
    let updatedCount = 0
    for (const item of toUpdate) {
        const { error } = await supabase
            .from('sku_metadata')
            .update(TARGET_DIMS)
            .eq('sku', item.sku)
        if (error) { console.error('  FAIL update ' + item.sku + ':', error.message) }
        else { updatedCount++ }
    }

    // 4. Execute inserts
    let insertedCount = 0
    if (toInsert.length > 0) {
        const { error } = await supabase
            .from('sku_metadata')
            .upsert(toInsert, { onConflict: 'sku' })
        if (error) { console.error('  FAIL insert:', error.message) }
        else { insertedCount = toInsert.length }
    }

    console.log('=== DONE ===')
    console.log('  Updated:  ' + updatedCount)
    console.log('  Inserted: ' + insertedCount)
    console.log('  Already matched: ' + alreadyMatch.length)
    console.log('  Skipped (shared w/ row 1-4): ' + (targetSkus.size - safeSkus.length))
}

run().catch(e => console.error('Fatal error:', e))
