-- Strict Row Level Security (RLS) Policies for Suvarna ERP

-- Enable RLS on all core tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Loan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LedgerEntry" ENABLE ROW LEVEL SECURITY;

-- 1. User Table Policy (Users can only see users in their own shop)
CREATE POLICY "Users can view users in their shop"
ON "User"
FOR SELECT
USING (
  shopId IN (
    SELECT shopId FROM "User" WHERE authId = auth.uid()::text
  )
);

CREATE POLICY "Users can update their own profile"
ON "User"
FOR UPDATE
USING (authId = auth.uid()::text);

-- 2. Shop Table Policy
CREATE POLICY "Users can view their own shop"
ON "Shop"
FOR SELECT
USING (
  id IN (
    SELECT shopId FROM "User" WHERE authId = auth.uid()::text
  )
);

-- 3. Branch Table Policy
CREATE POLICY "Users can view branches in their shop"
ON "Branch"
FOR SELECT
USING (
  shopId IN (
    SELECT shopId FROM "User" WHERE authId = auth.uid()::text
  )
);

-- 4. Customer Table Policy
CREATE POLICY "Users can view and edit customers in their shop"
ON "Customer"
FOR ALL
USING (
  shopId IN (
    SELECT shopId FROM "User" WHERE authId = auth.uid()::text
  )
);

-- 5. Loan Table Policy
CREATE POLICY "Users can view and edit loans in their shop"
ON "Loan"
FOR ALL
USING (
  shopId IN (
    SELECT shopId FROM "User" WHERE authId = auth.uid()::text
  )
);

-- 6. Payment Policy
CREATE POLICY "Users can view and edit payments in their shop"
ON "Payment"
FOR ALL
USING (
  loanId IN (
    SELECT id FROM "Loan" WHERE shopId IN (
      SELECT shopId FROM "User" WHERE authId = auth.uid()::text
    )
  )
);

-- 7. LedgerEntry Policy
CREATE POLICY "Users can view ledger entries in their shop"
ON "LedgerEntry"
FOR SELECT
USING (
  shopId IN (
    SELECT shopId FROM "User" WHERE authId = auth.uid()::text
  )
);
