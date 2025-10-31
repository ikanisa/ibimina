-- TapMoMo Supabase Database Schema

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    network TEXT NOT NULL CHECK (network IN ('MTN', 'Airtel')),
    merchant_code TEXT NOT NULL,
    secret_key BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network, merchant_code)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    nonce UUID NOT NULL UNIQUE,
    amount INTEGER,
    currency TEXT NOT NULL DEFAULT 'RWF',
    ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'failed')),
    payer_hint TEXT,
    notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_merchant_code ON merchants(merchant_code);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_nonce ON transactions(nonce);

-- Row Level Security (RLS)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchants
CREATE POLICY "Users can view their own merchants"
    ON merchants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchants"
    ON merchants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchants"
    ON merchants FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions for their merchants"
    ON transactions FOR SELECT
    USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update transactions"
    ON transactions FOR UPDATE
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for merchants updated_at
CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE merchants IS 'Mobile money merchants using TapMoMo';
COMMENT ON TABLE transactions IS 'Payment transactions initiated via NFC';
COMMENT ON COLUMN merchants.secret_key IS 'HMAC secret for payload signing (encrypted at rest)';
COMMENT ON COLUMN transactions.nonce IS 'Unique nonce from payment payload for replay protection';
COMMENT ON COLUMN transactions.payer_hint IS 'Optional hint about payer (phone number, name, etc)';
