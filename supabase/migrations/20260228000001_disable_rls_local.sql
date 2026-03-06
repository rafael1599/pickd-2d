
-- Disable RLS for local testing so we can see production data without sessions
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_inventory_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
