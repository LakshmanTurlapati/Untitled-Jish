/**
 * SQLite connection singleton for dictionary database.
 * Server-only -- never import in client components.
 */

import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

/**
 * Get or create a cached readonly database connection.
 * Opens data/sanskrit.db with WAL mode and 64MB cache.
 */
export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "data", "sanskrit.db");
    db = new Database(dbPath, { readonly: true });
    db.pragma("journal_mode = WAL");
    db.pragma("cache_size = -64000"); // 64MB cache
  }
  return db;
}
