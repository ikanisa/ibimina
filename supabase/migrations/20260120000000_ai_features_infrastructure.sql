-- AI Features Infrastructure Migration
-- This migration adds tables and policies for AI-powered features:
-- 1. Document Intelligence (Gemini Vision scanning)
-- 2. Fraud Detection Engine
-- 3. Voice Commands
-- 4. Accessibility Settings
-- 5. Real-Time Analytics

-- =====================================================
-- API Rate Limiting
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_api_rate_limits_user_endpoint ON public.api_rate_limits(user_id, endpoint);
CREATE INDEX idx_api_rate_limits_window ON public.api_rate_limits(window_start) WHERE window_start > NOW() - INTERVAL '1 hour';

COMMENT ON TABLE public.api_rate_limits IS 'Rate limiting for external API calls (Gemini, etc.)';

-- =====================================================
-- Fraud Detection
-- =====================================================

CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.allocations(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  suggested_action TEXT,
  related_transactions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'escalated')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_alerts_org ON public.fraud_alerts(organization_id);
CREATE INDEX idx_fraud_alerts_country ON public.fraud_alerts(country_id);
CREATE INDEX idx_fraud_alerts_txn ON public.fraud_alerts(transaction_id);
CREATE INDEX idx_fraud_alerts_status ON public.fraud_alerts(status) WHERE status = 'pending';
CREATE INDEX idx_fraud_alerts_severity ON public.fraud_alerts(severity) WHERE severity IN ('high', 'critical');
CREATE INDEX idx_fraud_alerts_created ON public.fraud_alerts(created_at DESC);

COMMENT ON TABLE public.fraud_alerts IS 'Fraud detection alerts from hybrid AI + rule-based engine';

-- Member fraud behavioral profiles
CREATE TABLE IF NOT EXISTS public.member_fraud_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  typical_amount_min NUMERIC(12,2),
  typical_amount_max NUMERIC(12,2),
  typical_amount_avg NUMERIC(12,2),
  payment_frequency NUMERIC(5,2),
  preferred_payment_days INTEGER[],
  usual_payment_hours JSONB,
  known_phone_numbers TEXT[],
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  transaction_count INTEGER DEFAULT 0,
  last_transaction_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id)
);

CREATE INDEX idx_member_fraud_profiles_member ON public.member_fraud_profiles(member_id);
CREATE INDEX idx_member_fraud_profiles_risk ON public.member_fraud_profiles(risk_score DESC) WHERE risk_score > 70;
CREATE INDEX idx_member_fraud_profiles_updated ON public.member_fraud_profiles(last_updated);

COMMENT ON TABLE public.member_fraud_profiles IS 'Behavioral profiles for fraud detection';

-- =====================================================
-- Document Intelligence
-- =====================================================

CREATE TABLE IF NOT EXISTS public.document_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  document_type TEXT CHECK (document_type IN ('receipt', 'id_card', 'bank_statement', 'contract', 'unknown')),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  extracted_data JSONB DEFAULT '{}'::jsonb,
  suggestions TEXT[],
  warnings TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_document_scans_org ON public.document_scans(organization_id);
CREATE INDEX idx_document_scans_country ON public.document_scans(country_id);
CREATE INDEX idx_document_scans_uploader ON public.document_scans(uploaded_by);
CREATE INDEX idx_document_scans_type ON public.document_scans(document_type);
CREATE INDEX idx_document_scans_status ON public.document_scans(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_document_scans_created ON public.document_scans(created_at DESC);

COMMENT ON TABLE public.document_scans IS 'Document scanning history (Gemini Vision)';

-- =====================================================
-- Voice Commands
-- =====================================================

CREATE TABLE IF NOT EXISTS public.voice_command_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  command_matched TEXT,
  action_taken TEXT,
  confidence NUMERIC(3,2),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_history_user ON public.voice_command_history(user_id);
CREATE INDEX idx_voice_history_created ON public.voice_command_history(created_at DESC);
CREATE INDEX idx_voice_history_success ON public.voice_command_history(success) WHERE success = false;

COMMENT ON TABLE public.voice_command_history IS 'Voice command usage history';

-- =====================================================
-- Accessibility
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_accessibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{
    "highContrast": false,
    "reducedMotion": false,
    "largeText": false,
    "textScaling": 1.0,
    "colorBlindMode": "none",
    "cursorSize": "normal",
    "screenReader": false,
    "soundEffects": true,
    "voiceFeedback": false,
    "keyboardNavigation": true,
    "focusIndicator": "default",
    "simplifiedUI": false,
    "readingGuide": false,
    "dyslexiaFont": false,
    "lineSpacing": 1.5,
    "wordSpacing": 0
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_accessibility_user ON public.user_accessibility_settings(user_id);

COMMENT ON TABLE public.user_accessibility_settings IS 'Per-user accessibility preferences';

-- =====================================================
-- Row Level Security Policies
-- =====================================================

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_fraud_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_command_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accessibility_settings ENABLE ROW LEVEL SECURITY;

-- API Rate Limits: Users can only see their own
CREATE POLICY "Users view own rate limits"
  ON public.api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own rate limits"
  ON public.api_rate_limits FOR ALL
  USING (auth.uid() = user_id);

-- Fraud Alerts: Organization staff only
CREATE POLICY "Staff view org fraud alerts"
  ON public.fraud_alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.staff_assignments 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff insert fraud alerts"
  ON public.fraud_alerts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.staff_assignments 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff update fraud alerts"
  ON public.fraud_alerts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.staff_assignments 
      WHERE user_id = auth.uid()
    )
  );

-- Member Fraud Profiles: Organization staff only
CREATE POLICY "Staff view member profiles"
  ON public.member_fraud_profiles FOR SELECT
  USING (
    member_id IN (
      SELECT gm.id 
      FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      JOIN public.staff_assignments sa ON sa.organization_id = g.org_id
      WHERE sa.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff manage member profiles"
  ON public.member_fraud_profiles FOR ALL
  USING (
    member_id IN (
      SELECT gm.id 
      FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      JOIN public.staff_assignments sa ON sa.organization_id = g.org_id
      WHERE sa.user_id = auth.uid()
    )
  );

-- Document Scans: Organization staff only
CREATE POLICY "Staff view org documents"
  ON public.document_scans FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.staff_assignments 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff upload documents"
  ON public.document_scans FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.staff_assignments 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff update documents"
  ON public.document_scans FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.staff_assignments 
      WHERE user_id = auth.uid()
    )
  );

-- Voice History: Users see only their own
CREATE POLICY "Users view own voice history"
  ON public.voice_command_history FOR ALL
  USING (auth.uid() = user_id);

-- Accessibility: Users manage only their own
CREATE POLICY "Users manage own accessibility"
  ON public.user_accessibility_settings FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Update fraud profile based on new transactions
CREATE OR REPLACE FUNCTION public.update_member_fraud_profile(
  p_member_id UUID,
  p_amount NUMERIC,
  p_phone TEXT,
  p_timestamp TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.member_fraud_profiles (
    member_id,
    typical_amount_min,
    typical_amount_max,
    typical_amount_avg,
    payment_frequency,
    known_phone_numbers,
    transaction_count,
    last_transaction_at
  )
  VALUES (
    p_member_id,
    p_amount,
    p_amount,
    p_amount,
    1,
    ARRAY[p_phone],
    1,
    p_timestamp
  )
  ON CONFLICT (member_id) DO UPDATE
  SET
    typical_amount_min = LEAST(member_fraud_profiles.typical_amount_min, p_amount),
    typical_amount_max = GREATEST(member_fraud_profiles.typical_amount_max, p_amount),
    typical_amount_avg = (member_fraud_profiles.typical_amount_avg * member_fraud_profiles.transaction_count + p_amount) / (member_fraud_profiles.transaction_count + 1),
    known_phone_numbers = (
      SELECT ARRAY_AGG(DISTINCT phone)
      FROM UNNEST(member_fraud_profiles.known_phone_numbers || p_phone) AS phone
      LIMIT 5
    ),
    transaction_count = member_fraud_profiles.transaction_count + 1,
    last_transaction_at = p_timestamp,
    last_updated = NOW();
END;
$$;

COMMENT ON FUNCTION public.update_member_fraud_profile IS 'Update member fraud profile with new transaction data';

-- Reset rate limit window
CREATE OR REPLACE FUNCTION public.reset_rate_limit_if_expired()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.window_start < NOW() - INTERVAL '1 hour' THEN
    NEW.window_start := NOW();
    NEW.request_count := 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reset_rate_limit_on_update
  BEFORE UPDATE ON public.api_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_rate_limit_if_expired();

-- =====================================================
-- Grants
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.api_rate_limits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.fraud_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.member_fraud_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.document_scans TO authenticated;
GRANT SELECT, INSERT ON public.voice_command_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_accessibility_settings TO authenticated;

-- =====================================================
-- Realtime
-- =====================================================

-- Enable realtime for fraud alerts (staff dashboards)
ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_alerts;

-- Enable realtime for document scans (upload progress)
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_scans;
