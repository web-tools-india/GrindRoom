CREATE OR REPLACE FUNCTION public.complete_session_admin(
  p_session_id uuid,
  p_user_id uuid,
  p_completed boolean
)
RETURNS TABLE (
  session_id uuid,
  ended_at timestamptz,
  completed boolean,
  actual_minutes integer,
  streak_count integer,
  longest_streak integer,
  last_session_date date,
  total_sessions integer,
  total_focus_minutes integer,
  was_already_completed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_yesterday date := ((now() AT TIME ZONE 'UTC')::date - 1);

  v_session_row sessions%ROWTYPE;
  v_updated_session sessions%ROWTYPE;
  v_profile_row profiles%ROWTYPE;

  v_actual_minutes integer;
  v_next_streak integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_session_row
  FROM sessions
  WHERE id = p_session_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO v_profile_row
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_session_row.ended_at IS NOT NULL THEN
    RETURN QUERY
    SELECT
      v_session_row.id,
      v_session_row.ended_at,
      COALESCE(v_session_row.completed, false),
      COALESCE(v_session_row.actual_minutes, 0),
      v_profile_row.streak_count,
      v_profile_row.longest_streak,
      v_profile_row.last_session_date,
      v_profile_row.total_sessions,
      v_profile_row.total_focus_minutes,
      true;

    RETURN;
  END IF;

  v_actual_minutes := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_now - v_session_row.started_at)) / 60)::integer);

  UPDATE sessions
  SET
    ended_at = v_now,
    completed = p_completed,
    actual_minutes = v_actual_minutes
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND ended_at IS NULL
  RETURNING * INTO v_updated_session;

  IF NOT FOUND THEN
    SELECT *
    INTO v_session_row
    FROM sessions
    WHERE id = p_session_id
      AND user_id = p_user_id;

    RETURN QUERY
    SELECT
      v_session_row.id,
      v_session_row.ended_at,
      COALESCE(v_session_row.completed, false),
      COALESCE(v_session_row.actual_minutes, 0),
      v_profile_row.streak_count,
      v_profile_row.longest_streak,
      v_profile_row.last_session_date,
      v_profile_row.total_sessions,
      v_profile_row.total_focus_minutes,
      true;

    RETURN;
  END IF;

  IF p_completed THEN
    IF v_profile_row.last_session_date = v_today THEN
      v_next_streak := v_profile_row.streak_count;
    ELSIF v_profile_row.last_session_date = v_yesterday THEN
      v_next_streak := v_profile_row.streak_count + 1;
    ELSE
      v_next_streak := 1;
    END IF;

    UPDATE profiles
    SET
      streak_count = v_next_streak,
      longest_streak = GREATEST(v_profile_row.longest_streak, v_next_streak),
      last_session_date = v_today,
      total_sessions = v_profile_row.total_sessions + 1,
      total_focus_minutes = v_profile_row.total_focus_minutes + v_actual_minutes
    WHERE id = p_user_id
    RETURNING * INTO v_profile_row;
  ELSE
    UPDATE profiles
    SET total_focus_minutes = v_profile_row.total_focus_minutes + v_actual_minutes
    WHERE id = p_user_id
    RETURNING * INTO v_profile_row;
  END IF;

  RETURN QUERY
  SELECT
    v_updated_session.id,
    v_updated_session.ended_at,
    COALESCE(v_updated_session.completed, false),
    COALESCE(v_updated_session.actual_minutes, 0),
    v_profile_row.streak_count,
    v_profile_row.longest_streak,
    v_profile_row.last_session_date,
    v_profile_row.total_sessions,
    v_profile_row.total_focus_minutes,
    false;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_session_admin(uuid, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_session_admin(uuid, uuid, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.complete_session_admin(uuid, uuid, boolean) TO service_role;
