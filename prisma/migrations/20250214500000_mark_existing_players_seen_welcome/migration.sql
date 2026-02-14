-- Users who already have at least one character are treated as "already saw welcome"
UPDATE "users"
SET "has_seen_welcome" = true
WHERE id IN (SELECT user_id FROM characters);
