const registerFn = require('./api/register');
const registrationsFn = require('./api/registrations');
const deleteFn = require('./api/delete');
const exportFn = require('./api/export');

process.env.ADMIN_PASSWORD = 'gbugodblessyou';

// Mock res object
function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: (k, v) => { res.headers[k] = v; },
    status: (code) => { res.statusCode = code; return res; },
    json: (data) => { res.body = data; return res; },
    send: (data) => { res.body = data; return res; },
    end: () => { return res; }
  };
  return res;
}

async function runTests() {
  console.log("--- TEST 1: Register ---");
  const req1 = {
    method: 'POST',
    headers: { 'x-forwarded-for': '127.0.0.1' },
    body: {
      name: 'Test User',
      email: 'test@example.com',
      project_title: 'My Project',
      project_description: 'This is a test project.',
      project_link: 'https://github.com/test'
    }
  };
  const res1 = mockRes();
  await registerFn(req1, res1);
  console.log("Register response:", res1.statusCode, res1.body);
  const regId = res1.body.id;

  console.log("\n--- TEST 2: Duplicate Register ---");
  const res2 = mockRes();
  await registerFn(req1, res2);
  console.log("Duplicate Register response:", res2.statusCode, res2.body);

  console.log("\n--- TEST 3: Login (List Auth Failed) ---");
  const req3 = { method: 'GET', headers: { authorization: 'Bearer wrong' }, query: {} };
  const res3 = mockRes();
  await registrationsFn(req3, res3);
  console.log("Failed Login response:", res3.statusCode, res3.body);

  console.log("\n--- TEST 4: List (Auth Success) ---");
  const req4 = { method: 'GET', headers: { authorization: 'Bearer gbugodblessyou' }, query: {} };
  const res4 = mockRes();
  await registrationsFn(req4, res4);
  console.log("List response:", res4.statusCode, res4.body.length, "items found.");
  
  console.log("\n--- TEST 5: Search ---");
  const req5 = { method: 'GET', headers: { authorization: 'Bearer gbugodblessyou' }, query: { search: 'Test User' } };
  const res5 = mockRes();
  await registrationsFn(req5, res5);
  console.log("Search response:", res5.statusCode, res5.body.length, "items found.");

  console.log("\n--- TEST 6: Export CSV ---");
  const req6 = { method: 'GET', headers: {}, query: { token: 'gbugodblessyou' } };
  const res6 = mockRes();
  await exportFn(req6, res6);
  console.log("Export CSV response:", res6.statusCode, "Length:", res6.body ? res6.body.length : 0);
  console.log("CSV Preview:", res6.body ? res6.body.substring(0, 100) + '...' : '');

  console.log("\n--- TEST 7: Delete ---");
  const req7 = { method: 'DELETE', headers: { authorization: 'Bearer gbugodblessyou' }, query: { id: regId } };
  const res7 = mockRes();
  await deleteFn(req7, res7);
  console.log("Delete response:", res7.statusCode, res7.body);
}

runTests().catch(console.error);
