import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const outputDirectory = path.dirname(fileURLToPath(import.meta.url));
const base = '{{baseUrl}}';
const json = (value) => JSON.stringify(value, null, 2);

const roleLogin = (role) => `
const role = '${role}';
const email = pm.environment.get(role + 'Email');
const password = pm.environment.get(role + 'Password');
if (!email || !password) {
  pm.execution.skipRequest();
  throw new Error('Set ' + role + 'Email and ' + role + 'Password in the active environment.');
}
const cachedToken = pm.environment.get(role + 'Token');
let tokenIsCurrent = false;
try {
  const payload = JSON.parse(atob(cachedToken.split('.')[1]));
  tokenIsCurrent = payload.exp * 1000 > Date.now() + 60000;
} catch { /* Obtain a fresh token below. */ }
const login = () => pm.sendRequest({
  url: pm.environment.get('baseUrl') + '/auth/login',
  method: 'POST',
  header: { 'Content-Type': 'application/json' },
  body: { mode: 'raw', raw: JSON.stringify({ email, password }) },
}, (error, response) => {
  if (error) { pm.execution.skipRequest(); throw error; }
  if (response.code >= 200 && response.code < 300) {
    const token = response.json().data.accessToken;
    pm.environment.set(role + 'Token', token);
    pm.variables.set('accessToken', token);
    return;
  }
  if (role === 'farmer' && response.code === 401) {
    pm.sendRequest({
      url: pm.environment.get('baseUrl') + '/auth/register', method: 'POST',
      header: { 'Content-Type': 'application/json' },
      body: { mode: 'raw', raw: JSON.stringify({ name: 'Postman Farmer', email, password }) },
    }, (registerError, registerResponse) => {
      if (registerError) { pm.execution.skipRequest(); throw registerError; }
      if (registerResponse.code !== 201) {
        pm.execution.skipRequest();
        throw new Error('Farmer auto-registration failed with HTTP ' + registerResponse.code + '. Use a fresh test database or update farmerEmail.');
      }
      login();
    });
    return;
  }
  pm.execution.skipRequest();
  throw new Error(role + ' login failed with HTTP ' + response.code + '. Check the environment and seed the required role.');
});
if (tokenIsCurrent) pm.variables.set('accessToken', cachedToken);
else login();`;

const endpoints = {
  Public: [
    ['GET', '/health', 200, null],
    ['POST', '/auth/register', 201, { name: 'Postman Registration', email: '{{registrationEmail}}', password: '{{farmerPassword}}' }, null, null, "pm.environment.set('registrationEmail', 'postman-' + Date.now() + '@example.com');"],
    ['POST', '/auth/login', 200, { email: '{{registrationEmail}}', password: '{{farmerPassword}}' }],
    ['POST', '/auth/refresh', 200, null],
    ['POST', '/auth/logout', 200, null],
  ],
  'Admin Setup': [
    ['GET', '/admin/ping', 200, null],
    ['GET', '/admin/stats', 200, null],
    ['GET', '/auth/me', 200, null, 'user'],
    ['GET', '/admin/users?search=farmer&page=1&limit=20', 200, null],
    ['PATCH', '/admin/users/{{userId}}', 200, { isActive: true }],
    ['GET', '/admin/resources?status=pending&page=1&limit=20', 200, null],
    ['POST', '/resources', 201, { name: 'Postman wheat seed', category: 'seed', description: 'Certified seed suitable for a local field trial.', price: 500, stock: 50, unit: 'kg', imageUrl: '' }, 'resource'],
    ['PATCH', '/resources/{{resourceId}}/status', 200, { status: 'approved' }],
    ['PATCH', '/admin/resources/{{resourceId}}/status', 200, { status: 'approved' }],
  ],
  Farmer: [
    ['GET', '/auth/me', 200, null],
    ['PATCH', '/auth/me/language', 200, { language: 'en' }],
    ['GET', '/farms?page=1&limit=20', 200, null],
    ['POST', '/farms', 201, { name: 'Postman Field', location: { type: 'Point', coordinates: [77.5946, 12.9716] }, district: 'Bengaluru Urban', state: 'Karnataka', areaInAcres: 5.5, soilType: 'loamy', irrigationType: 'drip' }, 'farm'],
    ['GET', '/farms/{{farmId}}', 200, null],
    ['PATCH', '/farms/{{farmId}}', 200, { name: 'Postman Field Updated' }],
    ['GET', '/crops?farmId={{farmId}}&page=1&limit=20', 200, null],
    ['POST', '/crops', 201, { farmId: '{{farmId}}', name: 'Wheat', variety: 'HD 2967', sowingDate: '2026-06-01', expectedHarvestDate: '2026-10-01', status: 'planned', yieldKg: 100 }, 'crop'],
    ['GET', '/crops/{{cropId}}', 200, null],
    ['PATCH', '/crops/{{cropId}}', 200, { status: 'growing' }],
    ['POST', '/crops/{{cropId}}/activities', 201, { type: 'irrigation', date: '2026-06-15', notes: 'Postman irrigation', quantity: 20 }, 'activity'],
    ['DELETE', '/crops/{{cropId}}/activities/{{activityId}}', 200, null],
    ['GET', '/soil?farmId={{farmId}}&page=1&limit=20', 200, null],
    ['POST', '/soil', 201, { farmId: '{{farmId}}', date: '2026-06-15', pH: 6.5, nitrogen: 50, phosphorus: 30, potassium: 40, moisture: 25, organicCarbon: 1.2 }, 'soilReport'],
    ['GET', '/soil/{{soilReportId}}', 200, null],
    ['GET', '/soil/{{soilReportId}}/recommendations', 200, null],
    ['PATCH', '/soil/{{soilReportId}}', 200, { pH: 6.6 }],
    ['GET', '/weather/{{farmId}}?cacheScope=postman-test-cache-scope-01', 200, null],
    ['GET', '/resources?search=seed&page=1&limit=20', 200, null],
    ['GET', '/resources/{{resourceId}}', 200, null],
    ['GET', '/orders?page=1&limit=20', 200, null],
    ['POST', '/orders', 201, { items: [{ resource: '{{resourceId}}', qty: 1 }], deliveryAddress: { recipientName: 'Postman Farmer', phone: '+919876543210', addressLine1: '1 Farm Road', addressLine2: '', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' } }, 'order'],
    ['GET', '/orders/{{orderId}}', 200, null],
    ['POST', '/orders', 201, { items: [{ resource: '{{resourceId}}', qty: 1 }], deliveryAddress: { recipientName: 'Postman Farmer', phone: '+919876543210', addressLine1: '2 Farm Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' } }, 'order', 'cancelOrderId'],
    ['GET', '/forum/posts?page=1&limit=20', 200, null],
    ['POST', '/forum/posts', 201, { title: 'Postman crop discussion', body: 'Sharing a field update with the community.', category: 'crops' }, 'post'],
    ['GET', '/forum/posts/{{postId}}', 200, null],
    ['PATCH', '/forum/posts/{{postId}}', 200, { title: 'Updated Postman crop discussion' }],
    ['POST', '/forum/posts/{{postId}}/like', 200, null],
    ['GET', '/forum/posts/{{postId}}/comments?page=1&limit=20', 200, null],
    ['POST', '/forum/posts/{{postId}}/comments', 201, { body: 'Thanks for sharing this update.' }, 'comment'],
    ['PATCH', '/forum/comments/{{commentId}}', 200, { body: 'Thanks for sharing this useful update.' }],
    ['DELETE', '/forum/comments/{{commentId}}', 204, null],
    ['POST', '/forum/report', 201, { targetType: 'post', targetId: '{{postId}}', reason: 'Example community report for API exercise.' }, 'report'],
    ['GET', '/consultations?status=open&page=1&limit=20', 200, null],
    ['POST', '/consultations', 201, { topic: 'Leaves turning yellow', description: 'The lower leaves are yellowing after recent heavy rain. What should I check first?', farmId: '{{farmId}}', cropId: '{{cropId}}' }, 'consultation'],
    ['GET', '/consultations/{{consultationId}}', 200, null],
  ],
  Expert: [
    ['GET', '/consultations?status=open&page=1&limit=20', 200, null],
    ['POST', '/alerts', 201, { type: 'general', severity: 'medium', title: 'Expert field notice', message: 'Monitor field conditions and follow local guidance.', region: { state: 'Karnataka' }, cropFilter: [] }],
    ['POST', '/consultations/{{consultationId}}/responses', 200, { message: 'Please inspect the root zone for standing water and check drainage.' }],
  ],
  'Admin Final': [
    ['GET', '/admin/orders?page=1&limit=20', 200, null],
    ['PATCH', '/admin/orders/{{orderId}}/status', 200, { status: 'approved' }],
    ['PATCH', '/orders/{{orderId}}/status', 200, { status: 'shipped' }],
    ['PATCH', '/admin/orders/{{orderId}}/status', 200, { status: 'delivered' }],
    ['POST', '/admin/alerts', 201, { type: 'general', severity: 'medium', title: 'Regional farm notice', message: 'Please check local advisories before applying treatments.', region: { state: 'Karnataka' }, cropFilter: [] }],
    ['GET', '/admin/reports?status=pending&page=1&limit=20', 200, null],
    ['GET', '/forum/reports?status=pending&page=1&limit=20', 200, null],
    ['PATCH', '/forum/reports/{{reportId}}', 200, { status: 'reviewed' }],
    ['PATCH', '/forum/posts/{{postId}}/moderation', 200, { isHidden: false }],
    ['PATCH', '/admin/reports/{{reportId}}', 200, { status: 'reviewed' }],
    ['POST', '/consultations/{{consultationId}}/responses', 200, { message: 'Please inspect the roots and check the drainage.' }],
    ['GET', '/consultations/{{consultationId}}/images/{{imageFilename}}', 404, null],
  ],
  'Farmer Follow-up': [
    ['GET', '/alerts?page=1&limit=20', 200, null],
    ['GET', '/notifications?page=1&limit=20', 200, null, 'notification'],
    ['PATCH', '/notifications/{{notificationId}}/read', 200, null],
    ['PATCH', '/orders/{{cancelOrderId}}/cancel', 200, null],
    ['PATCH', '/consultations/{{consultationId}}/close', 200, null],
    ['DELETE', '/forum/posts/{{postId}}', 204, null],
    ['DELETE', '/soil/{{soilReportId}}', 204, null],
    ['DELETE', '/crops/{{cropId}}', 204, null],
    ['DELETE', '/farms/{{farmId}}', 204, null],
  ],
};

const captureScript = (capture, targetKey) => {
  if (!capture) return '';
  const expression = capture === 'notification'
    ? "body.data.notifications?.[0]?._id"
    : capture === 'activity'
      ? 'body.data.crop?.activityLog?.[0]?._id'
    : capture === 'users'
      ? 'body.data.users?.[0]?._id'
      : capture === 'reports'
        ? 'body.data.reports?.[0]?._id'
        : `body.data.${capture}?._id`;
  const destination = targetKey || (capture === 'notification' ? 'notificationId' : `${capture}Id`);
  return `try { const body = pm.response.json(); const id = ${expression}; if (id) pm.environment.set('${destination}', id); } catch { /* Non-JSON response. */ }`;
};

const requestItem = ([method, route, status, body, capture, captureKey, requestPreScript]) => {
  const request = {
    method,
    header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
    url: `${base}${route}`,
  };
  if (body) request.body = { mode: 'raw', raw: json(body), options: { raw: { language: 'json' } } };
  return {
    name: `${method} ${route}`,
    request,
    event: [
      { listen: 'prerequest', script: { type: 'text/javascript', exec: [`pm.variables.set('expectedStatus', ${status});`, ...(requestPreScript ? [requestPreScript] : [])] } },
      { listen: 'test', script: { type: 'text/javascript', exec: [captureScript(capture, captureKey)] } },
    ],
  };
};

const folders = Object.entries(endpoints).map(([folderName, requests]) => {
  const role = folderName.startsWith('Admin') ? 'admin' : folderName.startsWith('Farmer') ? 'farmer' : folderName.toLowerCase();
  return {
  name: folderName,
  ...(folderName === 'Public' ? { auth: { type: 'noauth' } } : {
    auth: { type: 'bearer', bearer: [{ key: 'token', value: `{{${role}Token}}`, type: 'string' }] },
    event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: roleLogin(role).trim().split('\n') } }],
  }),
  item: requests.map(requestItem),
};
});

const collection = {
  info: {
    name: 'Agri-Tech API — Complete Route Coverage',
    description: 'Role-aware API collection covering health, auth, farms, crops, soil, weather, alerts, notifications, resources, orders, forum, consultations, and admin endpoints. Set the active environment and run folders in order. Dynamic IDs are captured after successful create/list responses.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000' },
  ],
  event: [{
    listen: 'test',
    script: { type: 'text/javascript', exec: [
      "const expected = Number(pm.variables.get('expectedStatus') || 200);",
      "pm.test('HTTP status is ' + expected, () => pm.expect(pm.response.code).to.eql(expected));",
      "if (pm.response.code !== 204 && (pm.response.headers.get('Content-Type') || '').includes('application/json')) {",
      "  const body = pm.response.json();",
      "  pm.test('API response envelope is valid', () => {",
      "    pm.expect(body).to.have.property('success').that.is.a('boolean');",
      "    if (body.success) pm.expect(body).to.have.property('data');",
      "    else { pm.expect(body.message).to.be.a('string'); pm.expect(body.errors).to.be.an('array'); }",
      '  });',
      '}',
    ] },
  }],
  item: folders,
};

const environment = {
  id: 'agri-tech-local-api',
  name: 'Agri-Tech Local API (Test DB)',
  values: [
    ['baseUrl', 'http://localhost:5000'],
    ['farmerEmail', 'postman-farmer@example.com'], ['farmerPassword', 'change-this-farmer-password'], ['farmerToken', ''],
    ['expertEmail', 'expert@example.com'], ['expertPassword', 'change-this-expert-password'], ['expertToken', ''],
    ['adminEmail', 'admin@example.com'], ['adminPassword', 'change-this-admin-password'], ['adminToken', ''],
    ['registrationEmail', 'postman-registration@example.com'],
    ...['userId', 'farmId', 'cropId', 'activityId', 'soilReportId', 'resourceId', 'orderId', 'postId', 'commentId', 'reportId', 'consultationId', 'notificationId'].map((key) => [key, '']),
    ['imageFilename', '00000000-0000-4000-8000-000000000000.jpg'],
  ].map(([key, value]) => ({ key, value, enabled: true, type: key.toLowerCase().includes('password') ? 'secret' : 'default' })),
  _postman_variable_scope: 'environment',
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: 'Agri-Tech collection generator',
};

await writeFile(path.join(outputDirectory, 'Agri-Tech-API.postman_collection.json'), `${JSON.stringify(collection, null, 2)}\n`);
await writeFile(path.join(outputDirectory, 'Agri-Tech-Local.postman_environment.json'), `${JSON.stringify(environment, null, 2)}\n`);
console.log(`Generated ${Object.values(endpoints).reduce((sum, values) => sum + values.length, 0)} API requests across ${folders.length} role folders.`);
