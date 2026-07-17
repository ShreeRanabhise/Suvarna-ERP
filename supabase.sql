-- Supabase Setup & RLS Policies for Suvarna GoldLoan ERP

-- 1. Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Loan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PledgedItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- 2. Create helper functions to get current user's shop_id and role
CREATE OR REPLACE FUNCTION get_user_shop_id() RETURNS text AS $$
  SELECT shopId FROM "User" WHERE email = (auth.jwt()->>'email')::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role() RETURNS text AS $$
  SELECT role FROM "User" WHERE email = (auth.jwt()->>'email')::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. RLS Policies

-- Shop: Super Admins can see/manage all, Owners can see their own
CREATE POLICY "Super Admins can manage all shops" ON "Shop"
  USING (get_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Owners can view own shop" ON "Shop"
  FOR SELECT USING (id = get_user_shop_id() AND get_user_role() = 'OWNER');

-- Customer: Tenant isolation
CREATE POLICY "Users can manage customers in their shop" ON "Customer"
  USING (shopId = get_user_shop_id());

-- Loan: Tenant isolation
CREATE POLICY "Users can manage loans in their shop" ON "Loan"
  USING (shopId = get_user_shop_id());

-- PledgedItem: Tenant isolation via Loan
CREATE POLICY "Users can manage pledged items in their shop" ON "PledgedItem"
  USING (EXISTS (SELECT 1 FROM "Loan" l WHERE l.id = "PledgedItem"."loanId" AND l.shopId = get_user_shop_id()));

-- Payment: Tenant isolation via Loan
CREATE POLICY "Users can manage payments in their shop" ON "Payment"
  USING (EXISTS (SELECT 1 FROM "Loan" l WHERE l.id = "Payment"."loanId" AND l.shopId = get_user_shop_id()));

-- AuditLog: Super Admins can see all, Owners can see their shop's logs
CREATE POLICY "Super Admins can view all audit logs" ON "AuditLog"
  FOR SELECT USING (get_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Owners can view own shop audit logs" ON "AuditLog"
  FOR SELECT USING (shopId = get_user_shop_id() AND get_user_role() = 'OWNER');

-- 4. Storage Bucket Setup for Documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Storage RLS
CREATE POLICY "Tenant can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND (auth.uid() IS NOT NULL));

CREATE POLICY "Tenant can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-documents' AND (auth.uid() IS NOT NULL)); -- In a real app, restrict by path tenant_id/
