
-- ====== ENUMS ======
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'pro', 'business');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.transaction_type AS ENUM ('signup_bonus', 'consumption', 'subscription', 'admin_grant', 'refund');

-- ====== PROFILES ======
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  default_dialect TEXT DEFAULT 'بيضاء',
  default_platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ====== USER ROLES ======
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ====== POINTS BALANCE ======
CREATE TABLE public.points_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.points_balance ENABLE ROW LEVEL SECURITY;

-- ====== TRANSACTIONS ======
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount INTEGER NOT NULL, -- positive = earned, negative = spent
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);

-- ====== SUBSCRIPTION REQUESTS ======
CREATE TABLE public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL,
  amount_sar INTEGER NOT NULL,
  points_to_grant INTEGER NOT NULL,
  proof_url TEXT,
  notes TEXT,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- ====== PRODUCT PROFILES ======
CREATE TABLE public.product_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  features TEXT,
  audience TEXT,
  protected_terms TEXT,
  preferred_tone TEXT,
  preferred_dialect TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_profiles ENABLE ROW LEVEL SECURITY;

-- ====== SAVED TEMPLATES ======
CREATE TABLE public.saved_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_templates ENABLE ROW LEVEL SECURITY;

-- ====== BRAND SETTINGS ======
CREATE TABLE public.brand_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_voice TEXT,
  brand_description TEXT,
  protected_terms TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- ====== GENERATED CONTENT ======
CREATE TABLE public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  input JSONB,
  output TEXT NOT NULL,
  metadata JSONB,
  points_used INTEGER NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_gen_content_user ON public.generated_content(user_id, created_at DESC);

-- ====== SYSTEM TEMPLATES ======
CREATE TABLE public.system_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;

-- ====== RLS POLICIES ======

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- points_balance
CREATE POLICY "Users view own balance" ON public.points_balance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all balances" ON public.points_balance FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- transactions
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- subscription_requests
CREATE POLICY "Users view own requests" ON public.subscription_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own requests" ON public.subscription_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all requests" ON public.subscription_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update requests" ON public.subscription_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- product_profiles
CREATE POLICY "Users manage own products" ON public.product_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- saved_templates
CREATE POLICY "Users manage own templates" ON public.saved_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- brand_settings
CREATE POLICY "Users manage own brand" ON public.brand_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- generated_content
CREATE POLICY "Users manage own content" ON public.generated_content FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all content" ON public.generated_content FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- system_templates
CREATE POLICY "Anyone views active templates" ON public.system_templates FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage templates" ON public.system_templates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ====== TRIGGER: auto-create profile + points + signup bonus ======
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.points_balance (user_id, balance, total_earned)
  VALUES (NEW.id, 50, 50);

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'signup_bonus', 50, 'هدية الترحيب — 50 نقطة مجانية');

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====== FUNCTION: consume points (server-side only) ======
CREATE OR REPLACE FUNCTION public.consume_points(_user_id UUID, _amount INTEGER, _tool TEXT, _description TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance FROM public.points_balance WHERE user_id = _user_id FOR UPDATE;
  IF current_balance IS NULL OR current_balance < _amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.points_balance
  SET balance = balance - _amount,
      total_spent = total_spent + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.transactions (user_id, type, amount, description, metadata)
  VALUES (_user_id, 'consumption', -_amount, _description, jsonb_build_object('tool', _tool));

  RETURN TRUE;
END;
$$;

-- ====== FUNCTION: grant points (admin) ======
CREATE OR REPLACE FUNCTION public.grant_points(_user_id UUID, _amount INTEGER, _type public.transaction_type, _description TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.points_balance (user_id, balance, total_earned)
  VALUES (_user_id, _amount, _amount)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = public.points_balance.balance + _amount,
    total_earned = public.points_balance.total_earned + _amount,
    updated_at = now();

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (_user_id, _type, _amount, _description);
END;
$$;
