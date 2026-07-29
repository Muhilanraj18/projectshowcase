const { createClient } = require('@libsql/client');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Simple security: require a secret key to prevent accidental re-runs
  const secret = req.query.secret;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || secret !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized. Add ?secret=YOUR_ADMIN_PASSWORD to the URL.' });
  }

  const rawUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const url = rawUrl ? rawUrl.replace('libsql://', 'https://') : rawUrl;

  if (!url || !authToken) {
    return res.status(500).json({ error: 'Database configuration missing. Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel environment variables.' });
  }

  const client = createClient({ url, authToken });

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        project_title TEXT NOT NULL,
        project_description TEXT NOT NULL,
        project_link TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verify it worked
    const check = await client.execute('SELECT COUNT(*) as count FROM registrations');
    const count = check.rows[0].count;

    return res.status(200).json({
      success: true,
      message: 'Database table created successfully!',
      existing_records: count
    });
  } catch (error) {
    console.error('Init error:', error);
    return res.status(500).json({ error: 'Failed to initialize database: ' + error.message });
  }
};
