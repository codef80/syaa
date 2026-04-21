-- 1) admin_adjust_points: إضافة أو خصم نقاط من أي مستخدم (موجب = إضافة، سالب = خصم)
CREATE OR REPLACE FUNCTION public.admin_adjust_points(
  _target_user_id uuid,
  _delta integer,
  _description text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  INSERT INTO public.points_balance (user_id, balance, total_earned, total_spent)
  VALUES (
    _target_user_id,
    GREATEST(_delta, 0),
    GREATEST(_delta, 0),
    GREATEST(-_delta, 0)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = GREATEST(public.points_balance.balance + _delta, 0),
    total_earned = public.points_balance.total_earned + GREATEST(_delta, 0),
    total_spent = public.points_balance.total_spent + GREATEST(-_delta, 0),
    updated_at = now();

  INSERT INTO public.transactions (user_id, type, amount, description, metadata)
  VALUES (
    _target_user_id,
    CASE WHEN _delta >= 0 THEN 'admin_grant'::transaction_type ELSE 'consumption'::transaction_type END,
    _delta,
    _description,
    jsonb_build_object('admin_id', auth.uid(), 'manual', true)
  );
END;
$$;

-- 2) admin_set_role: ترقية/تخفيض دور مستخدم
CREATE OR REPLACE FUNCTION public.admin_set_role(
  _target_user_id uuid,
  _new_role app_role
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- منع الأدمن من تخفيض نفسه
  IF _target_user_id = auth.uid() AND _new_role <> 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot remove your own admin role';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _new_role);
END;
$$;

-- 3) admin_delete_user: حذف مستخدم نهائياً (يحذف من auth.users بسبب CASCADE)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- حذف البيانات المرتبطة يدوياً (لا توجد FK cascade)
  DELETE FROM public.transactions WHERE user_id = _target_user_id;
  DELETE FROM public.points_balance WHERE user_id = _target_user_id;
  DELETE FROM public.generated_content WHERE user_id = _target_user_id;
  DELETE FROM public.saved_templates WHERE user_id = _target_user_id;
  DELETE FROM public.product_profiles WHERE user_id = _target_user_id;
  DELETE FROM public.brand_settings WHERE user_id = _target_user_id;
  DELETE FROM public.subscription_requests WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE id = _target_user_id;
  DELETE FROM auth.users WHERE id = _target_user_id;
END;
$$;

-- 4) admin_update_profile: تعديل اسم/بريد أي مستخدم
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  _target_user_id uuid,
  _display_name text,
  _email text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  UPDATE public.profiles
  SET display_name = COALESCE(_display_name, display_name),
      email = COALESCE(_email, email),
      updated_at = now()
  WHERE id = _target_user_id;
END;
$$;

-- 5) سياسات RLS للأدمن على profiles (تحديث/حذف)
CREATE POLICY "Admins update any profile"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6) سياسة: الأدمن يشاهد كل القوالب الشخصية وكل ملفات المنتجات (للمراقبة)
CREATE POLICY "Admins view all saved templates"
ON public.saved_templates FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins view all products"
ON public.product_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));