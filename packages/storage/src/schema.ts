import type Database from "better-sqlite3";

const CREATE_QUOTES_TABLE = `
  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    face_value REAL NOT NULL,
    face_currency TEXT NOT NULL,
    region TEXT NOT NULL,
    price_rub REAL NOT NULL,
    price_rub_was REAL,
    discount_pct REAL,
    source TEXT NOT NULL,
    source_url TEXT,
    fetched_at TEXT NOT NULL
  )
`;

const INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_quotes_brand ON quotes(brand)",
  "CREATE INDEX IF NOT EXISTS idx_quotes_face_value ON quotes(face_value)",
  "CREATE INDEX IF NOT EXISTS idx_quotes_region ON quotes(region)",
  "CREATE INDEX IF NOT EXISTS idx_quotes_fetched_at ON quotes(fetched_at)",
  "CREATE INDEX IF NOT EXISTS idx_quotes_lookup ON quotes(brand, face_value, region, fetched_at)",
] as const;

export function initSchema(db: Database.Database): void {
  db.exec(CREATE_QUOTES_TABLE);
  for (const indexSql of INDEXES) {
    db.exec(indexSql);
  }
}
