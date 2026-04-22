-- Create ai_model_settings table to allow admin to control which models are used for flash and pro tiers
CREATE TABLE public.ai_model_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  flash_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  pro_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-pro',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT single_row CHECK (id = TRUE)
);

-- Insert the single row with defaults
INSERT INTO public.ai_model_settings (id) VALUES (TRUE);

-- Enable RLS
ALTER TABLE public.ai_model_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (server function needs it)
CREATE POLICY "Anyone authenticated can read model settings"
ON public.ai_model_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can update
CREATE POLICY "Only admins can update model settings"
ON public.ai_model_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin RPC to update settings with validation (allowed model whitelist)
CREATE OR REPLACE FUNCTION public.admin_update_ai_models(_flash_model TEXT, _pro_model TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF _flash_model NOT IN ('google/gemini-3-flash-preview', 'google/gemini-2.5-flash') THEN
    RAISE EXCEPTION 'Invalid flash model: %', _flash_model;
  END IF;

  IF _pro_model NOT IN ('google/gemini-2.5-pro', 'google/gemini-3.1-pro-preview') THEN
    RAISE EXCEPTION 'Invalid pro model: %', _pro_model;
  END IF;

  UPDATE public.ai_model_settings
  SET flash_model = _flash_model,
      pro_model = _pro_model,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = TRUE;
END;
$$;