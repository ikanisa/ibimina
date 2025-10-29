-- Ensure existing multitenancy policies enforce WITH CHECK clauses
ALTER POLICY sacco_modify_multitenancy
  ON app.saccos
  USING (
    public.is_platform_admin()
    OR (org_id IS NOT NULL AND public.user_can_access_org(org_id))
    OR (org_id IS NULL AND app.is_admin())
  );

ALTER POLICY sacco_modify_multitenancy
  ON app.saccos
  WITH CHECK (
    public.is_platform_admin()
    OR (org_id IS NOT NULL AND public.user_can_access_org(org_id))
    OR (org_id IS NULL AND app.is_admin())
  );

ALTER POLICY ikimina_modify_multitenancy
  ON app.ikimina
  USING (
    public.is_platform_admin()
    OR (org_id IS NOT NULL AND public.user_can_access_org(org_id))
    OR (org_id IS NULL AND (app.is_admin() OR sacco_id = app.current_sacco()))
  );

ALTER POLICY ikimina_modify_multitenancy
  ON app.ikimina
  WITH CHECK (
    public.is_platform_admin()
    OR (org_id IS NOT NULL AND public.user_can_access_org(org_id))
    OR (org_id IS NULL AND (app.is_admin() OR sacco_id = app.current_sacco()))
  );

ALTER POLICY members_modify_multitenancy
  ON app.members
  USING (
    public.is_platform_admin()
    OR (org_id IS NOT NULL AND public.user_can_access_org(org_id))
    OR (org_id IS NULL AND (app.is_admin() OR sacco_id = app.current_sacco()))
  );

ALTER POLICY members_modify_multitenancy
  ON app.members
  WITH CHECK (
    public.is_platform_admin()
    OR (org_id IS NOT NULL AND public.user_can_access_org(org_id))
    OR (org_id IS NULL AND (app.is_admin() OR sacco_id = app.current_sacco()))
  );
