/**
 * One-time migration: adds `phone` column to existing registrations table.
 * Run once: node db-migrate-phone.js
 */
const { createClient } = require('@libsql/client');

async function migrate() {
  const rawUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const url = rawUrl ? rawUrl.replace('libsql://', 'https://') : rawUrl;

  if (!url || !authToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN env vars.');
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  try {
    // Add phone column if it doesn't exist already
    await client.execute(`ALTER TABLE registrations ADD COLUMN phone TEXT`);
    console.log("Migration complete: 'phone' column added to registrations table.");
  } catch (error) {
    if (error.message && error.message.includes('duplicate column name')) {
      console.log("Column 'phone' already exists, no changes needed.");
    } else {
      console.error('Migration failed:', error.message || error);
      process.exit(1);
    }
  }
}

migrate();
