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

  if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return res.status(500).json({ error: 'Database configuration missing.' });
  }

  const client = createClient({ url, authToken });
  const searchQuery = req.query.search;

  try {
    let sql = 'SELECT * FROM registrations';
    let args = [];

    if (searchQuery) {
      sql += ' WHERE name LIKE ? OR project_title LIKE ?';
      const term = `%${searchQuery}%`;
      args = [term, term];
    }
    
    sql += ' ORDER BY id ASC';

    const result = await client.execute({ sql, args });

    const registrations = result.rows.map(row => ({
      id: row.id,
      regNumber: 'REG-' + row.id.toString().padStart(4, '0'),
      name: row.name,
      email: row.email,
      project_title: row.project_title,
      project_description: row.project_description,
      project_link: row.project_link,
      submitted_at: row.submitted_at
    }));

    return res.status(200).json(registrations);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
};
