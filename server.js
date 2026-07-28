const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // Serve HTML/CSS files

// Setup Vercel-style API routes manually for local testing
const registerAPI = require('./api/register');
const registrationsAPI = require('./api/registrations');
const deleteAPI = require('./api/delete');
const exportAPI = require('./api/export');

// Default Admin Password for local testing (matches the tests)
process.env.ADMIN_PASSWORD = 'gbugodblessyou';
// We'll also use the Turso credentials you already provided
process.env.TURSO_DATABASE_URL = 'libsql://project-showcase-muhilanraj.aws-ap-south-1.turso.io';
process.env.TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODUyMjg3NDUsImlkIjoiMDE5ZmE3ZWItNDUwMS03ZDljLWJiNDctZmZmYWRiYjVjMTBjIiwia2lkIjoiUFYwRGhpVnlnemhzVDBXalRzSklKbnBMNW5FekZFVjd2NWE4bnBlM2Q1ZyIsInJpZCI6ImFkNGVlNmNhLTczMzgtNDZjNi04YWFlLWIxNjNlZDVhOWI2MSJ9.zQ21e1ZTn2p8eVvB_OfYFSdXMg0HaSQrnj3D7I4q-dX4wjND5jb1b3oN8yDCY_q6Y7ebhnTedtUuDF9aWuDuCg';

app.post('/api/register', async (req, res) => {
  await registerAPI(req, res);
});

app.get('/api/registrations', async (req, res) => {
  await registrationsAPI(req, res);
});

app.delete('/api/delete', async (req, res) => {
  await deleteAPI(req, res);
});

app.get('/api/export', async (req, res) => {
  await exportAPI(req, res);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'shadastria-adepti.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Local dev server running!`);
  console.log(`👉 Main page:     http://localhost:${PORT}/`);
  console.log(`👉 Registration:  http://localhost:${PORT}/reg.html`);
  console.log(`👉 Admin:         http://localhost:${PORT}/admin.html`);
  console.log(`=========================================`);
});
