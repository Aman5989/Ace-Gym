-- Ace-Gym: persistent dashboard hero image managed by Admins.
CREATE TABLE IF NOT EXISTS public.gym_settings (
  id text PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
  hero_image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.gym_settings (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gym_settings_select_authenticated" ON public.gym_settings;
CREATE POLICY "gym_settings_select_authenticated"
  ON public.gym_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "gym_settings_admin_insert" ON public.gym_settings;
CREATE POLICY "gym_settings_admin_insert"
  ON public.gym_settings FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "gym_settings_admin_update" ON public.gym_settings;
CREATE POLICY "gym_settings_admin_update"
  ON public.gym_settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-assets', 'gym-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "gym_assets_public_read" ON storage.objects;
CREATE POLICY "gym_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gym-assets');

DROP POLICY IF EXISTS "gym_assets_admin_insert" ON storage.objects;
CREATE POLICY "gym_assets_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gym-assets' AND public.is_admin());

DROP POLICY IF EXISTS "gym_assets_admin_update" ON storage.objects;
CREATE POLICY "gym_assets_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gym-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'gym-assets' AND public.is_admin());
