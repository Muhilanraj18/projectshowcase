module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = req.query.secret;

  if (!adminPassword || secret !== adminPassword) {
    return res.status(401).json({ error: 'Add ?secret=YOUR_ADMIN_PASSWORD to URL' });
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const report = {
    env: {
      TURSO_DATABASE_URL: url ? `SET (${url})` : 'MISSING',
      TURSO_AUTH_TOKEN: authToken ? `SET (length: ${authToken.length})` : 'MISSING',
      ADMIN_PASSWORD: adminPassword ? `SET (length: ${adminPassword.length})` : 'MISSING',
    },
    database: null,
    error: null
  };

  if (!url || !authToken) {
    report.database = 'Skipped — env vars missing';
    return res.status(200).json(report);
  }

  try {
    const { createClient } = require('@libsql/client/http');
    const client = createClient({ url, authToken });
    const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    report.database = {
      connected: true,
      tables: result.rows.map(r => r.name)
    };
  } catch (err) {
    report.database = { connected: false };
    report.error = err.message;
  }

  return res.status(200).json(report);
};
