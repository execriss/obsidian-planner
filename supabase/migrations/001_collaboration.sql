-- ═══════════════════════════════════════════════════════════════════════════════
-- COLLABORATION SYSTEM
-- Run this in the Supabase SQL editor to enable section sharing between users.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── INVITATIONS ─────────────────────────────────────────────────────────────
-- Stores pending/resolved sharing invitations.
-- inviter_email is stored explicitly so the invitee can see who invited them.
-- invitee_email is used for lookup via JWT claim (auth.jwt() ->> 'email').

CREATE TABLE IF NOT EXISTS invitations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_email  TEXT        NOT NULL,
  invitee_email  TEXT        NOT NULL,
  sections       TEXT[]      NOT NULL DEFAULT '{}',
  status         TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Inviter can read, insert, and delete their own invitations
DROP POLICY IF EXISTS "inviter_full_access"         ON invitations;
CREATE POLICY       "inviter_full_access"           ON invitations
  USING  (inviter_id = auth.uid())
  WITH CHECK (inviter_id = auth.uid());

-- Invitee can read invitations addressed to their email
DROP POLICY IF EXISTS "invitee_can_read"            ON invitations;
CREATE POLICY       "invitee_can_read"              ON invitations
  FOR SELECT
  USING (invitee_email = (auth.jwt() ->> 'email'));

-- Invitee can update status (accept / reject)
DROP POLICY IF EXISTS "invitee_can_update_status"   ON invitations;
CREATE POLICY       "invitee_can_update_status"     ON invitations
  FOR UPDATE
  USING      (invitee_email = (auth.jwt() ->> 'email'))
  WITH CHECK (invitee_email = (auth.jwt() ->> 'email'));


-- ─── COLLABORATIONS ───────────────────────────────────────────────────────────
-- Each accepted invitation creates one row per shared section.
-- Emails are stored directly to avoid needing auth.users access from the client.

CREATE TABLE IF NOT EXISTS collaborations (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email        TEXT        NOT NULL,
  collaborator_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collaborator_email TEXT        NOT NULL,
  section            TEXT        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, collaborator_id, section)
);

ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- Owner and collaborator can read their collaborations
DROP POLICY IF EXISTS "collab_read"   ON collaborations;
CREATE POLICY       "collab_read"     ON collaborations
  FOR SELECT
  USING (owner_id = auth.uid() OR collaborator_id = auth.uid());

-- Collaborator inserts the rows when accepting an invitation
DROP POLICY IF EXISTS "collab_insert" ON collaborations;
CREATE POLICY       "collab_insert"   ON collaborations
  FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR collaborator_id = auth.uid());

-- Either party can remove the collaboration
DROP POLICY IF EXISTS "collab_delete" ON collaborations;
CREATE POLICY       "collab_delete"   ON collaborations
  FOR DELETE
  USING (owner_id = auth.uid() OR collaborator_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════════════
-- EXTEND EXISTING TABLE POLICIES WITH COLLABORATION ACCESS
--
-- NOTE: These policies are ADDITIVE. Supabase ORs permissive policies together,
-- so your existing per-user policies remain intact. These only add collaborator
-- access on top. If a table does not yet have RLS enabled, add:
--   ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
-- ═══════════════════════════════════════════════════════════════════════════════

-- Helper macro used in every policy below:
-- EXISTS (SELECT 1 FROM collaborations c
--         WHERE c.owner_id = <table>.user_id
--           AND c.collaborator_id = auth.uid()
--           AND c.section = '<section>')

-- ─── GROCERY ITEMS ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "collab_grocery_items_select" ON grocery_items;
CREATE POLICY       "collab_grocery_items_select"   ON grocery_items
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = grocery_items.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'grocery'
    )
  );

DROP POLICY IF EXISTS "collab_grocery_items_insert" ON grocery_items;
CREATE POLICY       "collab_grocery_items_insert"   ON grocery_items
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = grocery_items.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'grocery'
    )
  );

DROP POLICY IF EXISTS "collab_grocery_items_update" ON grocery_items;
CREATE POLICY       "collab_grocery_items_update"   ON grocery_items
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = grocery_items.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'grocery'
    )
  );

DROP POLICY IF EXISTS "collab_grocery_items_delete" ON grocery_items;
CREATE POLICY       "collab_grocery_items_delete"   ON grocery_items
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = grocery_items.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'grocery'
    )
  );

-- ─── GROCERY SESSIONS ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "collab_grocery_sessions_select" ON grocery_sessions;
CREATE POLICY       "collab_grocery_sessions_select"   ON grocery_sessions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = grocery_sessions.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'grocery'
    )
  );

DROP POLICY IF EXISTS "collab_grocery_sessions_insert" ON grocery_sessions;
CREATE POLICY       "collab_grocery_sessions_insert"   ON grocery_sessions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = grocery_sessions.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'grocery'
    )
  );

-- ─── BUDGET ITEMS ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "collab_budget_items_select" ON budget_items;
CREATE POLICY       "collab_budget_items_select"   ON budget_items
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_items.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

DROP POLICY IF EXISTS "collab_budget_items_insert" ON budget_items;
CREATE POLICY       "collab_budget_items_insert"   ON budget_items
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_items.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

DROP POLICY IF EXISTS "collab_budget_items_update" ON budget_items;
CREATE POLICY       "collab_budget_items_update"   ON budget_items
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_items.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

DROP POLICY IF EXISTS "collab_budget_items_delete" ON budget_items;
CREATE POLICY       "collab_budget_items_delete"   ON budget_items
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_items.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

-- ─── BUDGET ENTRIES ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "collab_budget_entries_select" ON budget_entries;
CREATE POLICY       "collab_budget_entries_select"   ON budget_entries
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_entries.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

DROP POLICY IF EXISTS "collab_budget_entries_insert" ON budget_entries;
CREATE POLICY       "collab_budget_entries_insert"   ON budget_entries
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_entries.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

DROP POLICY IF EXISTS "collab_budget_entries_update" ON budget_entries;
CREATE POLICY       "collab_budget_entries_update"   ON budget_entries
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_entries.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

-- ─── BUDGET INCOME ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "collab_budget_income_select" ON budget_income;
CREATE POLICY       "collab_budget_income_select"   ON budget_income
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_income.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

DROP POLICY IF EXISTS "collab_budget_income_insert" ON budget_income;
CREATE POLICY       "collab_budget_income_insert"   ON budget_income
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_income.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

DROP POLICY IF EXISTS "collab_budget_income_update" ON budget_income;
CREATE POLICY       "collab_budget_income_update"   ON budget_income
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_income.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );

DROP POLICY IF EXISTS "collab_budget_income_delete" ON budget_income;
CREATE POLICY       "collab_budget_income_delete"   ON budget_income
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborations c
      WHERE c.owner_id = budget_income.user_id
        AND c.collaborator_id = auth.uid()
        AND c.section = 'budget'
    )
  );
