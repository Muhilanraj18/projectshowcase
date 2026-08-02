const { createClient } = require('@libsql/client');

async function recreateDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const client = createClient({ url, authToken });

  try {
    await client.execute(`DROP TABLE IF EXISTS registrations`);
    await client.execute(`
      CREATE TABLE registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        project_title TEXT NOT NULL,
        project_description TEXT NOT NULL,
        project_link TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'registrations' recreated successfully.");
  } catch (error) {
    console.error("Failed to recreate DB:", error);
  }
}
recreateDb();
