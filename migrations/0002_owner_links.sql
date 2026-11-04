-- Secret token for the business owner's read-only dashboard (/b/<token>).
-- NULL = no owner access. Regenerating it invalidates the old link.
ALTER TABLE businesses ADD COLUMN owner_token TEXT;
CREATE UNIQUE INDEX idx_businesses_owner_token ON businesses(owner_token);
