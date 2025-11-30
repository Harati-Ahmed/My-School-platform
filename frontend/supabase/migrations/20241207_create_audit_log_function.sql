-- =============================================
-- Migration: Create audit_log function if missing
-- =============================================
-- This migration ensures the create_audit_log function exists
-- which is required by the audit_users trigger

-- Drop any existing versions of the function with different signatures
DROP FUNCTION IF EXISTS create_audit_log(UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, UUID);
DROP FUNCTION IF EXISTS create_audit_log(UUID, TEXT, VARCHAR, UUID, JSONB, JSONB, UUID);
DROP FUNCTION IF EXISTS create_audit_log(UUID, VARCHAR, NAME, UUID, JSONB, JSONB, UUID);

-- Function to create audit log entry
-- Note: p_entity_type must be 'name' type (not VARCHAR) to match TG_TABLE_NAME from triggers
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type NAME,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_school_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  -- Only insert if audit_logs table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    INSERT INTO audit_logs (
      user_id, action, entity_type, entity_id, 
      old_values, new_values, school_id
    ) VALUES (
      p_user_id, p_action, p_entity_type, p_entity_id,
      p_old_values, p_new_values, p_school_id
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION create_audit_log IS 
  'Creates an audit log entry. Returns NULL if audit_logs table does not exist.';

