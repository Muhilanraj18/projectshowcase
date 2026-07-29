const { createClient } = require('@libsql/client');

module.exports = async function(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // We support Authorization header OR token in query param for CSV downloads
  // since standard <a> tags don't support custom headers easily.
  const queryToken = req.query.token;
  
  if (!adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isAuth = (authHeader === `Bearer ${adminPassword}`) || (queryToken === adminPassword);
  if (!isAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rawUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const url = rawUrl ? rawUrl.replace('libsql://', 'https://') : rawUrl;

  if (!url || !authToken) {
    return res.status(500).json({ error: 'Database configuration missing.' });
  }

  const client = createClient({ url, authToken });

  try {
    const result = await client.execute('SELECT * FROM registrations ORDER BY id ASC');

    const headers = ['Reg No.', 'Name', 'Email', 'Project Title', 'Description', 'Link', 'Submitted At'];
    
    const csvEscape = (v) => '"' + String(v ?? '').replace(/"/g,'""') + '"';
    
    const rows = result.rows.map(row => {
      const regNo = 'REG-' + row.id.toString().padStart(4, '0');
      return [
        regNo,
        row.name,
        row.email,
        row.project_title,
        row.project_description,
        row.project_link,
        row.submitted_at
      ].map(csvEscape).join(',');
    });

    const csv = [headers.map(csvEscape).join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
    res.setHeader('Content-Disposition', 'attachment; filename="showcase-registrations.csv"');
    return res.status(200).send(csv);

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to export registrations.' });
  }
};
