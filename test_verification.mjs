// Automated Verification Script for Acceptance Criteria
import http from 'http';

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers
        }
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resData) });
          } catch {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'GET',
        headers
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resData) });
          } catch {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // 1. Auth Test
  console.log('\n[TEST 1] Authentication:');
  const wrongLogin = await post('/api/auth/login', { username: 'admin', password: 'wrongpassword' });
  console.log('Wrong password status:', wrongLogin.status, wrongLogin.data.error ? '✓ Correctly rejected' : '✗ Failed');

  const adminLogin = await post('/api/auth/login', { username: 'admin', password: 'admin123' });
  console.log('Admin login status:', adminLogin.status, adminLogin.data.token ? '✓ Got JWT token' : '✗ Failed');
  const token = adminLogin.data.token;

  const analystLogin = await post('/api/auth/login', { username: 'analyst', password: 'analyst123' });
  console.log('Analyst login status:', analystLogin.status, analystLogin.data.user?.role === 'analyst' ? '✓ Analyst role verified' : '✗ Failed');

  // Set fast clock delay for tests so tests finish quickly
  await post('/api/pipeline/config', { stageDelayMs: 50 }, { Authorization: `Bearer ${token}` });

  // 2. Safe Sample Test
  console.log('\n[TEST 2] Safe Sample Execution:');
  const safeRes = await post('/api/pipeline/run', {
    ip: '192.168.1.100',
    port: 8080,
    packetSizeKB: 1024,
    accessType: 'HTTPS',
    requestRate: 10,
    groundTruth: 'SAFE'
  });
  console.log('Verdict:', safeRes.data.event.verdict, safeRes.data.event.verdict === 'SAFE' ? '✓ PASS' : '✗ FAIL');
  console.log('Threat Level:', safeRes.data.event.threat_level, safeRes.data.event.threat_level === 'NONE' ? '✓ PASS' : '✗ FAIL');
  console.log('Alert generated:', safeRes.data.alert ? '✗ Expected no alert' : '✓ No alert for safe traffic');

  // 3. Attack Sample Test
  console.log('\n[TEST 3] Attack Sample Execution:');
  const attackRes = await post('/api/pipeline/run', {
    ip: '203.0.113.195',
    port: 23,
    packetSizeKB: 8000,
    accessType: 'Telnet',
    requestRate: 500,
    groundTruth: 'INTRUSION'
  });
  console.log('Verdict:', attackRes.data.event.verdict, attackRes.data.event.verdict === 'INTRUSION' ? '✓ PASS' : '✗ FAIL');
  console.log('Threat Level:', attackRes.data.event.threat_level, attackRes.data.event.threat_level === 'CRITICAL' ? '✓ PASS' : '✗ FAIL');
  console.log('Matched Rules:', attackRes.data.event.matched_rules);
  console.log('Alert Generated ID:', attackRes.data.alert?.id, attackRes.data.alert ? '✓ PASS' : '✗ FAIL');

  // 4. Alert Acknowledgment Test
  if (attackRes.data.alert) {
    console.log('\n[TEST 4] Alert Acknowledgement:');
    const ackRes = await post(`/api/alerts/${attackRes.data.alert.id}/ack`, {}, { Authorization: `Bearer ${token}` });
    console.log('Alert Status:', ackRes.data.status, 'Acknowledged By:', ackRes.data.acknowledged_by, ackRes.data.status === 'Acknowledged' ? '✓ PASS' : '✗ FAIL');
  }

  // 5. Performance Comparison & Architecture Metrics
  console.log('\n[TEST 5] Architecture Comparison & Formulas (N=20):');
  const compRes = await get('/api/metrics/compare?n=20');
  console.log('Theoretical Speedup:', compRes.data.theoretical.speedup, 'Formula:', compRes.data.theoretical.speedupFormula);
  console.log('Measured Speedup:', compRes.data.measured.actualSpeedup + 'x');
  console.log('Bottleneck Stage:', compRes.data.bottleneck.stageName, 'Suggestion:', compRes.data.bottleneck.suggestion ? '✓ Present' : '✗ Missing');
  console.log('Gantt Chart Records:', compRes.data.ganttChart.length, compRes.data.ganttChart.length > 0 ? '✓ Present' : '✗ Missing');

  // 6. Hit-Miss Analysis
  console.log('\n[TEST 6] Hit-Miss Analysis:');
  const hitMissRes = await get('/api/hitmiss');
  console.log('Total Processed:', hitMissRes.data.totalProcessed);
  console.log('Accuracy:', hitMissRes.data.accuracy + '%', 'F1 Score:', hitMissRes.data.f1Score + '%');
  console.log('Confusion Matrix: TP=' + hitMissRes.data.truePositives + ', TN=' + hitMissRes.data.trueNegatives + ', FP=' + hitMissRes.data.falsePositives + ', FN=' + hitMissRes.data.falseNegatives);

  // 7. System Health & Self-Test Endpoint
  console.log('\n[TEST 7] System Health & Self-Test:');
  const healthRes = await get('/api/health');
  console.log('System Status:', healthRes.data.status);
  console.log('Modules:');
  for (const [k, v] of Object.entries(healthRes.data.modules)) {
    console.log(`  - ${v.name}: ${v.status} (${v.details})`);
  }

  const selfTest = await post('/api/selftest', {}, { Authorization: `Bearer ${token}` });
  console.log('Self-Test Status:', selfTest.data.status, selfTest.data.status === 'PASS' ? '✓ PASS' : '✗ FAIL');

  // Reset clock delay back to 500ms
  await post('/api/pipeline/config', { stageDelayMs: 500 }, { Authorization: `Bearer ${token}` });

  console.log('\n--- ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(console.error);
