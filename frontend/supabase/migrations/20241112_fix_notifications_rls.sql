-- =============================================
-- Fix notifications trigger RLS violation
-- Ensures notification inserts run with row_security disabled
-- =============================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_school_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
SET row_security = off
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    related_id,
    school_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_related_id,
    p_school_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

ALTER FUNCTION create_notification(
  UUID,
  notification_type,
  VARCHAR,
  TEXT,
  TEXT,
  UUID,
  UUID
) OWNER TO postgres;


