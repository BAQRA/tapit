-- Businesses you sell cards to
CREATE TABLE businesses (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  review_url  TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,   -- 0 = stop redirecting (e.g. unpaid)
  created_at  INTEGER NOT NULL
);

-- Physical NFC cards. business_id is NULL until the card is sold/assigned,
-- so you can program a stack of blank cards in advance.
CREATE TABLE cards (
  id           TEXT PRIMARY KEY,
  business_id  TEXT REFERENCES businesses(id),
  label        TEXT,
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL
);
CREATE INDEX idx_cards_business ON cards(business_id);

-- One row per tap
CREATE TABLE taps (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id      TEXT NOT NULL,
  business_id  TEXT,
  ts           INTEGER NOT NULL,              -- unix ms
  outcome      TEXT NOT NULL,                 -- redirect | inactive | unassigned
  country      TEXT,
  city         TEXT,
  device       TEXT,                          -- ios | android | other
  ua           TEXT,
  visitor      TEXT                           -- daily-salted IP hash (not reversible, resets daily)
);
CREATE INDEX idx_taps_ts ON taps(ts);
CREATE INDEX idx_taps_business_ts ON taps(business_id, ts);
CREATE INDEX idx_taps_card_ts ON taps(card_id, ts);
