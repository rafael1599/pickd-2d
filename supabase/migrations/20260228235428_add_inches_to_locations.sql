
-- 1. Add length_in (inches) to locations table
ALTER TABLE "public"."locations" ADD COLUMN IF NOT EXISTS "length_in" integer DEFAULT 0;

-- 2. Add width_in (inches) to locations table
ALTER TABLE "public"."locations" ADD COLUMN IF NOT EXISTS "width_in" integer DEFAULT 0;

-- 3. Update existing data: Split length_ft into ft and in if it was decimal
-- Actually, we'll keep length_ft as the primary numeric feet for now, 
-- but we want the separate storage too for UI accuracy if provided.
-- For legacy data, let's just initialize in = 0.

COMMENT ON COLUMN "public"."locations"."length_in" IS 'Additional inches beyond the length_ft total.';
COMMENT ON COLUMN "public"."locations"."width_in" IS 'Additional inches beyond the width_ft total.';
