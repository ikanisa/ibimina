-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('SYSTEM_ADMIN', 'SACCO_MANAGER', 'SACCO_STAFF');

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'SACCO_STAFF',
  sacco_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SACCOs table
CREATE TABLE public.saccos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  sector_code TEXT NOT NULL,
  merchant_code TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Ibimina table
CREATE TABLE public.ibimina (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id UUID NOT NULL REFERENCES public.saccos(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Ikimina Members table
CREATE TABLE public.ikimina_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ikimina_id UUID NOT NULL REFERENCES public.ibimina(id) ON DELETE CASCADE,
  member_code TEXT,
  full_name TEXT NOT NULL,
  national_id TEXT,
  msisdn TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SMS Inbox table
CREATE TABLE public.sms_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id UUID REFERENCES public.saccos(id),
  raw_text TEXT NOT NULL,
  msisdn TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  vendor_meta JSONB,
  parsed_json JSONB,
  parse_source TEXT,
  confidence FLOAT,
  status TEXT NOT NULL DEFAULT 'NEW',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'SMS',
  sacco_id UUID NOT NULL REFERENCES public.saccos(id),
  ikimina_id UUID REFERENCES public.ibimina(id),
  member_id UUID REFERENCES public.ikimina_members(id),
  msisdn TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  txn_id TEXT NOT NULL,
  reference TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  source_id UUID REFERENCES public.sms_inbox(id),
  ai_version TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL,
  owner_id UUID NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Ledger Entries table
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_id UUID NOT NULL REFERENCES public.accounts(id),
  credit_id UUID NOT NULL REFERENCES public.accounts(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  value_date TIMESTAMPTZ NOT NULL,
  external_id TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Audit Log table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  diff_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for users.sacco_id
ALTER TABLE public.users 
  ADD CONSTRAINT users_sacco_id_fkey 
  FOREIGN KEY (sacco_id) REFERENCES public.saccos(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saccos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibimina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ikimina_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = _user_id AND role = _role
  )
$$;

-- Create security definer function to get user's SACCO
CREATE OR REPLACE FUNCTION public.get_user_sacco(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sacco_id FROM public.users WHERE id = _user_id
$$;

-- RLS Policies for users table
CREATE POLICY "Users can view their own record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "System admins can view all users"
  ON public.users FOR SELECT
  USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

CREATE POLICY "System admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

CREATE POLICY "System admins can update users"
  ON public.users FOR UPDATE
  USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- RLS Policies for saccos table
CREATE POLICY "System admins can view all SACCOs"
  ON public.saccos FOR SELECT
  USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

CREATE POLICY "SACCO staff can view their SACCO"
  ON public.saccos FOR SELECT
  USING (id = public.get_user_sacco(auth.uid()));

CREATE POLICY "System admins can manage SACCOs"
  ON public.saccos FOR ALL
  USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- RLS Policies for ibimina table
CREATE POLICY "Users can view ibimina in their SACCO"
  ON public.ibimina FOR SELECT
  USING (sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

CREATE POLICY "SACCO staff can manage ibimina in their SACCO"
  ON public.ibimina FOR ALL
  USING (sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- RLS Policies for ikimina_members table
CREATE POLICY "Users can view members in their SACCO's ibimina"
  ON public.ikimina_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ibimina
      WHERE ibimina.id = ikimina_members.ikimina_id
      AND (ibimina.sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'))
    )
  );

CREATE POLICY "SACCO staff can manage members in their SACCO's ibimina"
  ON public.ikimina_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ibimina
      WHERE ibimina.id = ikimina_members.ikimina_id
      AND (ibimina.sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'))
    )
  );

-- RLS Policies for sms_inbox table
CREATE POLICY "Users can view SMS in their SACCO"
  ON public.sms_inbox FOR SELECT
  USING (sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

CREATE POLICY "SACCO staff can manage SMS in their SACCO"
  ON public.sms_inbox FOR ALL
  USING (sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- RLS Policies for payments table
CREATE POLICY "Users can view payments in their SACCO"
  ON public.payments FOR SELECT
  USING (sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

CREATE POLICY "SACCO staff can manage payments in their SACCO"
  ON public.payments FOR ALL
  USING (sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- RLS Policies for accounts table
CREATE POLICY "Users can view accounts in their SACCO"
  ON public.accounts FOR SELECT
  USING (
    owner_type = 'IKIMINA' AND EXISTS (
      SELECT 1 FROM public.ibimina
      WHERE ibimina.id = accounts.owner_id::UUID
      AND (ibimina.sacco_id = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'))
    )
    OR owner_type = 'SACCO' AND (owner_id::UUID = public.get_user_sacco(auth.uid()) OR public.has_role(auth.uid(), 'SYSTEM_ADMIN'))
    OR public.has_role(auth.uid(), 'SYSTEM_ADMIN')
  );

CREATE POLICY "SACCO staff can manage accounts in their SACCO"
  ON public.accounts FOR ALL
  USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- RLS Policies for ledger_entries table
CREATE POLICY "Users can view ledger entries"
  ON public.ledger_entries FOR SELECT
  USING (true);

CREATE POLICY "System admins can manage ledger entries"
  ON public.ledger_entries FOR ALL
  USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- RLS Policies for audit_logs table
CREATE POLICY "Users can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN') OR actor_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Create trigger for user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'SACCO_STAFF'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_ibimina_sacco_id ON public.ibimina(sacco_id);
CREATE INDEX idx_ikimina_members_ikimina_id ON public.ikimina_members(ikimina_id);
CREATE INDEX idx_ikimina_members_msisdn ON public.ikimina_members(msisdn);
CREATE INDEX idx_sms_inbox_status ON public.sms_inbox(status);
CREATE INDEX idx_sms_inbox_received_at ON public.sms_inbox(received_at DESC);
CREATE INDEX idx_payments_sacco_id ON public.payments(sacco_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_txn_id ON public.payments(txn_id);
CREATE INDEX idx_payments_reference ON public.payments(reference);
CREATE INDEX idx_ledger_entries_external_id ON public.ledger_entries(external_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);