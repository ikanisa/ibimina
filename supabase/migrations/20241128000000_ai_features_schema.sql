-- AI Features: Database Schema
-- Description: Tables for Document Intelligence, Fraud Detection, Voice Commands, and Accessibility
-- Author: Ibimina AI Team
-- Date: 2024-11-28

-- ============================================================================
-- API Rate Limiting
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_endpoint UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_api_rate_limits_user ON api_rate_limits(user_id);
CREATE INDEX idx_api_rate_limits_endpoint ON api_rate_limits(endpoint);

COMMENT ON TABLE api_rate_limits IS 'Rate limiting for AI API calls (Gemini)';

-- ============================================================================
-- Fraud Detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES allocations(id) ON DELETE SET NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  suggested_action TEXT,
  related_transactions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'escalated')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_fraud_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  typical_amount_min NUMERIC(12,2),
  typical_amount_max NUMERIC(12,2),
  typical_amount_avg NUMERIC(12,2),
  payment_frequency NUMERIC(5,2),
  preferred_payment_days INTEGER[],
  usual_payment_hours JSONB,
  known_phone_numbers TEXT[],
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_member_profile UNIQUE(member_id)
);

CREATE INDEX idx_fraud_alerts_org ON fraud_alerts(organization_id);
CREATE INDEX idx_fraud_alerts_country ON fraud_alerts(country_id);
CREATE INDEX idx_fraud_alerts_txn ON fraud_alerts(transaction_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_member_profiles_member ON member_fraud_profiles(member_id);

COMMENT ON TABLE fraud_alerts IS 'AI-detected fraud alerts for transactions';
COMMENT ON TABLE member_fraud_profiles IS 'Member payment behavior profiles for fraud detection';

-- ============================================================================
-- Document Intelligence
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  document_type TEXT,
  confidence NUMERIC(3,2),
  extracted_data JSONB,
  suggestions TEXT[],
  warnings TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_scans_org ON document_scans(organization_id);
CREATE INDEX idx_document_scans_country ON document_scans(country_id);
CREATE INDEX idx_document_scans_uploader ON document_scans(uploaded_by);
CREATE INDEX idx_document_scans_status ON document_scans(status);
CREATE INDEX idx_document_scans_type ON document_scans(document_type);

COMMENT ON TABLE document_scans IS 'AI-scanned documents (receipts, IDs, statements)';

-- ============================================================================
-- Voice Commands
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_command_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  command_matched TEXT,
  action_taken TEXT,
  confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_history_user ON voice_command_history(user_id);
CREATE INDEX idx_voice_history_created ON voice_command_history(created_at DESC);

COMMENT ON TABLE voice_command_history IS 'Voice command usage history for analytics';

-- ============================================================================
-- Accessibility Settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_accessibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_accessibility UNIQUE(user_id)
);

CREATE INDEX idx_accessibility_user ON user_accessibility_settings(user_id);

COMMENT ON TABLE user_accessibility_settings IS 'Per-user accessibility preferences';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_fraud_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_command_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accessibility_settings ENABLE ROW LEVEL SECURITY;

-- API Rate Limits: Users can only see their own
CREATE POLICY "Users view own rate limits"
  ON api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts rate limits"
  ON api_rate_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System updates rate limits"
  ON api_rate_limits FOR UPDATE
  USING (auth.uid() = user_id);

-- Fraud Alerts: Org staff only
CREATE POLICY "Staff view org fraud alerts"
  ON fraud_alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff insert fraud alerts"
  ON fraud_alerts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff update fraud alerts"
  ON fraud_alerts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

-- Member Profiles: Org staff only
CREATE POLICY "Staff view member profiles"
  ON member_fraud_profiles FOR SELECT
  USING (
    member_id IN (
      SELECT gm.id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      JOIN staff_assignments sa ON sa.organization_id = g.org_id
      WHERE sa.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff update member profiles"
  ON member_fraud_profiles FOR ALL
  USING (
    member_id IN (
      SELECT gm.id FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      JOIN staff_assignments sa ON sa.organization_id = g.org_id
      WHERE sa.user_id = auth.uid()
    )
  );

-- Document Scans: Org staff only
CREATE POLICY "Staff view org documents"
  ON document_scans FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff upload documents"
  ON document_scans FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM staff_assignments WHERE user_id = auth.uid()
    )
  );

-- Voice History: Users see their own
CREATE POLICY "Users view own voice history"
  ON voice_command_history FOR ALL
  USING (auth.uid() = user_id);

-- Accessibility: Users manage their own
CREATE POLICY "Users manage own accessibility"
  ON user_accessibility_settings FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fraud_alerts_updated_at
  BEFORE UPDATE ON fraud_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_scans_updated_at
  BEFORE UPDATE ON document_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessibility_settings_updated_at
  BEFORE UPDATE ON user_accessibility_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_rate_limits_updated_at
  BEFORE UPDATE ON api_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON api_rate_limits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fraud_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON member_fraud_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON document_scans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON voice_command_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_accessibility_settings TO authenticated;
