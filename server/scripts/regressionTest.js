const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runRegression() {
  console.log('--- STARTING FITCORE FULL REGRESSION VERIFICATION ---');

  // 1. Health check
  console.log('\n[1] Health Check...');
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  if (health.statusCode === 200 && health.data.database === 'connected') {
    console.log('✅ Health check OK. Database: connected');
  } else {
    throw new Error('Health check failed: ' + JSON.stringify(health.data));
  }

  // 2. Admin Login & Dashboard check
  console.log('\n[2] Admin Login & Dashboard Access...');
  const adminLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@fitcore.com', password: 'Admin@FitCore2026' }
  );
  if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
  const adminCookie = adminLogin.headers['set-cookie']?.[0]?.split(';')[0];

  const adminDash = await request({ hostname: 'localhost', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Cookie: adminCookie } });
  if (adminDash.statusCode === 200 && adminDash.data.stats) {
    console.log('✅ Admin dashboard verified. Total members:', adminDash.data.stats.totalMembers);
  } else {
    throw new Error('Admin dashboard failed');
  }

  // 3. Trainer Login & Dashboard check
  console.log('\n[3] Trainer Login & Dashboard Access...');
  const trainerLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'trainer@fitcore.com', password: 'Trainer@FitCore2026' }
  );
  if (trainerLogin.statusCode !== 200) throw new Error('Trainer login failed');
  const trainerCookie = trainerLogin.headers['set-cookie']?.[0]?.split(';')[0];

  const trainerDash = await request({ hostname: 'localhost', port: 5000, path: '/api/trainer/dashboard', method: 'GET', headers: { Cookie: trainerCookie } });
  if (trainerDash.statusCode === 200 && trainerDash.data.trainer) {
    console.log('✅ Trainer dashboard verified. Coach:', trainerDash.data.trainer.name);
  } else {
    throw new Error('Trainer dashboard failed');
  }

  // 4. Member Registration, Login & Dashboard check
  console.log('\n[4] Member Registration & Dashboard Access...');
  const regEmail = `athlete.reg.${Date.now()}@fitcore.com`;
  const regRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Regression Athlete', email: regEmail, phone: '9000011111', password: 'AthletePassword123!' }
  );
  if (regRes.statusCode !== 201) throw new Error('Member registration failed');
  const memberCookie = regRes.headers['set-cookie']?.[0]?.split(';')[0];

  const memberDash = await request({ hostname: 'localhost', port: 5000, path: '/api/member/dashboard', method: 'GET', headers: { Cookie: memberCookie } });
  if (memberDash.statusCode === 200 && memberDash.data.member) {
    console.log('✅ Member dashboard verified. Athlete:', memberDash.data.member.name);
  } else {
    throw new Error('Member dashboard failed');
  }

  // 5. Cross-role Security Assertions
  console.log('\n[5] Cross-role Security Isolation Tests...');
  const tOnAdmin = await request({ hostname: 'localhost', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Cookie: trainerCookie } });
  if (tOnAdmin.statusCode !== 403) throw new Error('Trainer should be 403 on admin');

  const mOnAdmin = await request({ hostname: 'localhost', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Cookie: memberCookie } });
  if (mOnAdmin.statusCode !== 403) throw new Error('Member should be 403 on admin');

  const mOnTrainer = await request({ hostname: 'localhost', port: 5000, path: '/api/trainer/dashboard', method: 'GET', headers: { Cookie: memberCookie } });
  if (mOnTrainer.statusCode !== 403) throw new Error('Member should be 403 on trainer');

  const tOnMember = await request({ hostname: 'localhost', port: 5000, path: '/api/member/dashboard', method: 'GET', headers: { Cookie: trainerCookie } });
  if (tOnMember.statusCode !== 403) throw new Error('Trainer should be 403 on member');

  console.log('✅ All 4 cross-role security boundary tests returned 403 Forbidden as required!');

  console.log('\n✨ FULL REGRESSION TEST PASSED WITH ZERO ERRORS!');
}

runRegression().catch((err) => {
  console.error('\n❌ REGRESSION FAILED:', err.message);
  process.exit(1);
});
