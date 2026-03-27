-- RPC: get_location_activity
-- Returns per-location activity metrics from inventory_logs for pickd-2d visualizations.
-- SECURITY DEFINER so the anon key (used by pickd-2d) can read logs without bypassing RLS globally.
-- READ-ONLY: this function never modifies data.

CREATE OR REPLACE FUNCTION "public"."get_location_activity"(
  "p_warehouse" "text" DEFAULT 'LUDLOW'::"text",
  "p_days_short" integer DEFAULT 7,
  "p_days_long" integer DEFAULT 30
)
RETURNS TABLE(
  "location" "text",
  "last_touched_at" timestamp with time zone,
  "movement_count_short" bigint,
  "movement_count_long" bigint
)
LANGUAGE "sql"
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    COALESCE(from_location, to_location)                         AS location,
    MAX(created_at)                                              AS last_touched_at,
    COUNT(*) FILTER (WHERE created_at >= NOW() - (p_days_short || ' days')::interval) AS movement_count_short,
    COUNT(*) FILTER (WHERE created_at >= NOW() - (p_days_long  || ' days')::interval) AS movement_count_long
  FROM inventory_logs
  WHERE
    is_reversed = FALSE
    AND (
      (from_warehouse = p_warehouse AND from_location IS NOT NULL)
      OR
      (to_warehouse   = p_warehouse AND to_location   IS NOT NULL)
    )
  GROUP BY COALESCE(from_location, to_location)
$$;

ALTER FUNCTION "public"."get_location_activity"(
  "text", integer, integer
) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."get_location_activity"("text", integer, integer) IS
  'Returns movement frequency and last-touched timestamp per location for pickd-2d activity heatmap. Read-only, anon-accessible via SECURITY DEFINER.';

GRANT EXECUTE ON FUNCTION "public"."get_location_activity"("text", integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_location_activity"("text", integer, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_location_activity"("text", integer, integer) TO "service_role";
