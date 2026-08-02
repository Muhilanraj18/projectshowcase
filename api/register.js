const { createClient } = require('@libsql/client');

// Basic in-memory rate limiting (per instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 5;

module.exports = async function(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const userRate = rateLimitMap.get(ip) || { count: 0, firstRequest: now };
  
  if (now - userRate.firstRequest > RATE_LIMIT_WINDOW_MS) {
    userRate.count = 1;
    userRate.firstRequest = now;
  } else {
    userRate.count += 1;
  }
  rateLimitMap.set(ip, userRate);

  if (userRate.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }

  const { name, email, phone, project_title, project_description, project_link } = req.body;

  if (!name || !email || !phone || !project_title || !project_description) {
    return res.status(400).json({ error: 'Name, email, phone, project title, and description are required.' });
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(String(email).trim().toLowerCase())) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  // Validate phone format (10-15 digits, optional leading +)
  const phoneClean = String(phone).replace(/[\s\-()]/g, '');
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  if (!phoneRegex.test(phoneClean)) {
    return res.status(400).json({ error: 'Invalid phone number. Please enter a valid 10-digit number.' });
  }

  // Basic sanitization
  const sanitize = (str) => String(str || '').trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  const sName = sanitize(name);
  const sEmail = sanitize(email).toLowerCase();
  const sPhone = sanitize(phoneClean);
  const sTitle = sanitize(project_title);
  const sDesc = sanitize(project_description);
  const sLink = project_link ? sanitize(project_link) : null;

  const rawUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const url = rawUrl ? rawUrl.replace('libsql://', 'https://') : rawUrl;

  if (!url || !authToken) {
    return res.status(500).json({ error: 'Database configuration missing.' });
  }

  const client = createClient({ url, authToken });

  try {
    // Check for duplicate email
    const existing = await client.execute({
      sql: 'SELECT id FROM registrations WHERE email = ?',
      args: [sEmail]
    });
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    // Insert new registration
    const result = await client.execute({
      sql: `INSERT INTO registrations (name, email, phone, project_title, project_description, project_link) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [sName, sEmail, sPhone, sTitle, sDesc, sLink]
    });

    const insertedId = result.lastInsertRowid.toString();
    const regNumber = 'REG-' + insertedId.padStart(4, '0');

    return res.status(200).json({ id: insertedId, regNumber });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to process registration.' });
  }
};
