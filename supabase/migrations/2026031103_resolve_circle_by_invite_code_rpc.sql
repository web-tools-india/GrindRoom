CREATE OR REPLACE FUNCTION public.resolve_circle_by_invite_code(p_invite_code text)
RETURNS TABLE (
  id uuid,
  name text,
  invite_code text,
  created_by uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT c.id, c.name, c.invite_code, c.created_by, c.created_at
  FROM public.circles c
  WHERE c.invite_code = UPPER(TRIM(p_invite_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Circle not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_circle_by_invite_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_circle_by_invite_code(text) TO authenticated;
