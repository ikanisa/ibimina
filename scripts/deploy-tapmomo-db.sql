-- Deploy TapMoMo Database Schema
-- This script combines all TapMoMo migrations into a single deployable script

BEGIN;

-- =============================================================================
-- TAPMOMO MERCHANTS & TRANSACTIONS SCHEMA
-- =============================================================================

-- Create tapmomo_merchants table
CREATE TABLE IF NOT EXISTS public.tapmomo_merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    network TEXT NOT NULL CHECK (network IN ('MTN', 'Airtel')),
    merchant_code TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL, -- Base64 encoded secret for HMAC
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_tapmomo_merchants_user_id ON public.tapmomo_merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_tapmomo_merchants_merchant_code ON public.tapmomo_merchants(merchant_code);
CREATE INDEX IF NOT EXISTS idx_tapmomo_merchants_network ON public.tapmomo_merchants(network);

-- Create tapmomo_transactions table
CREATE TABLE IF NOT EXISTS public.tapmomo_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.tapmomo_merchants(id) ON DELETE CASCADE,
    nonce UUID NOT NULL UNIQUE,
    amount INTEGER,
    currency TEXT NOT NULL DEFAULT 'RWF' CHECK (currency IN ('RWF', 'USD', 'EUR')),
    ref TEXT,
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'settled', 'failed', 'cancelled')),
    payer_hint TEXT,
    payment_method TEXT DEFAULT 'NFC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_tapmomo_tx_merchant_id ON public.tapmomo_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_tapmomo_tx_nonce ON public.tapmomo_transactions(nonce);
CREATE INDEX IF NOT EXISTS idx_tapmomo_tx_created_at ON public.tapmomo_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tapmomo_tx_status ON public.tapmomo_transactions(status);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.tapmomo_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tapmomo_transactions ENABLE ROW LEVEL SECURITY;

-- Merchant policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tapmomo_merchants' AND policyname = 'Users can view their own merchants'
    ) THEN
        CREATE POLICY "Users can view their own merchants" ON public.tapmomo_merchants FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tapmomo_merchants' AND policyname = 'Users can create their own merchants'
    ) THEN
        CREATE POLICY "Users can create their own merchants" ON public.tapmomo_merchants FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tapmomo_merchants' AND policyname = 'Users can update their own merchants'
    ) THEN
        CREATE POLICY "Users can update their own merchants" ON public.tapmomo_merchants FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tapmomo_merchants' AND policyname = 'Users can delete their own merchants'
    ) THEN
        CREATE POLICY "Users can delete their own merchants" ON public.tapmomo_merchants FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Transaction policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tapmomo_transactions' AND policyname = 'Users can view transactions for their merchants'
    ) THEN
        CREATE POLICY "Users can view transactions for their merchants" ON public.tapmomo_transactions FOR SELECT 
        USING (merchant_id IN (SELECT id FROM public.tapmomo_merchants WHERE user_id = auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tapmomo_transactions' AND policyname = 'Users can create transactions for their merchants'
    ) THEN
        CREATE POLICY "Users can create transactions for their merchants" ON public.tapmomo_transactions FOR INSERT 
        WITH CHECK (merchant_id IN (SELECT id FROM public.tapmomo_merchants WHERE user_id = auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tapmomo_transactions' AND policyname = 'Users can update their merchant transactions'
    ) THEN
        CREATE POLICY "Users can update their merchant transactions" ON public.tapmomo_transactions FOR UPDATE 
        USING (merchant_id IN (SELECT id FROM public.tapmomo_merchants WHERE user_id = auth.uid()));
    END IF;
END $$;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Create update trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS update_tapmomo_merchants_updated_at ON public.tapmomo_merchants;
CREATE TRIGGER update_tapmomo_merchants_updated_at
    BEFORE UPDATE ON public.tapmomo_merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tapmomo_transactions_updated_at ON public.tapmomo_transactions;
CREATE TRIGGER update_tapmomo_transactions_updated_at
    BEFORE UPDATE ON public.tapmomo_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.tapmomo_merchants IS 'TapMoMo merchants registered for NFC/USSD payments';
COMMENT ON TABLE public.tapmomo_transactions IS 'TapMoMo payment transactions';

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tapmomo_merchants') THEN
        RAISE EXCEPTION 'Table tapmomo_merchants was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tapmomo_transactions') THEN
        RAISE EXCEPTION 'Table tapmomo_transactions was not created';
    END IF;
    
    RAISE NOTICE 'TapMoMo schema deployed successfully!';
END $$;
