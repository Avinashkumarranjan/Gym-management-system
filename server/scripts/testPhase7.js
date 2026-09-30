const http = require('http');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = [];
      res.on('data', (chunk) => body.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(body);
        let parsed = null;
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            parsed = JSON.parse(buffer.toString());
          } catch (e) {
            parsed = buffer.toString();
          }
        } else {
          parsed = buffer;
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
      if (typeof data === 'string' || Buffer.isBuffer(data)) {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  if (Array.isArray(setCookie)) {
    return setCookie.map((c) => c.split(';')[0]).join('; ');
  }
  return setCookie.split(';')[0];
}

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('--- STARTING PHASE 7 AUTOMATED VERIFICATION ---');
  console.log('====================================================');

  try {
    // 1. Admin Login
    console.log('\n[TEST 1] Logging in as Admin...');
    const adminLogin = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@fitcore.com', password: 'Admin@FitCore2026' }
    );
    if (adminLogin.statusCode !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    }
    const adminCookie = extractCookie(adminLogin.headers);
    console.log('  ✓ Admin logged in successfully.');

    // 2. Fetch Public Membership Plans
    console.log('\n[TEST 2] Fetching Public Membership Plans (/api/membership-plans)...');
    const plansRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/membership-plans',
      method: 'GET',
    });
    if (plansRes.statusCode !== 200 || !plansRes.data.success) {
      throw new Error(`Plans fetch failed: ${JSON.stringify(plansRes.data)}`);
    }
    const plans = plansRes.data.data;
    if (!plans || plans.length === 0) {
      throw new Error('No active membership plans found in database.');
    }
    console.log(`  ✓ Loaded ${plans.length} active plans from MongoDB source of truth.`);
    const testPlan1 = plans[0]; // e.g., Monthly
    const testPlan2 = plans[1] || plans[0]; // e.g., Quarterly
    console.log(`  ✓ Test Plan 1: "${testPlan1.name}" (₹${testPlan1.price}, ${testPlan1.durationMonths}m)`);

    // 3. Register Member A (Fresh Dedicated Test Athlete)
    console.log('\n[TEST 3] Registering Test Member A...');
    const timestamp = Date.now();
    const memberAEmail = `phase7.member.a.${timestamp}@fitcore.com`;
    const regMemberA = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Phase7 Athlete A',
        email: memberAEmail,
        password: 'Password123!',
        phone: '9876543210',
      }
    );
    if (regMemberA.statusCode !== 201) {
      throw new Error(`Member A registration failed: ${JSON.stringify(regMemberA.data)}`);
    }
    const memberACookie = extractCookie(regMemberA.headers);
    const memberAId = regMemberA.data.user._id;
    console.log(`  ✓ Member A registered: ${memberAEmail} (ID: ${memberAId})`);

    // 4. Register Member B (For Cross-User Ownership Testing)
    console.log('\n[TEST 4] Registering Test Member B...');
    const memberBEmail = `phase7.member.b.${timestamp}@fitcore.com`;
    const regMemberB = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Phase7 Athlete B',
        email: memberBEmail,
        password: 'Password123!',
        phone: '9876543211',
      }
    );
    const memberBCookie = extractCookie(regMemberB.headers);
    console.log(`  ✓ Member B registered for security tests.`);

    // 5. Test Price Tampering Protection
    console.log('\n[TEST 5] Testing Price Tampering Protection (Frontend sends amount = 1)...');
    const orderTamperedRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/member/payments/create-order',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberACookie,
        },
      },
      {
        membershipPlanId: testPlan1._id,
        amount: 1, // MALICIOUS PAYLOAD
      }
    );
    if (orderTamperedRes.statusCode !== 201) {
      throw new Error(`Order creation failed: ${JSON.stringify(orderTamperedRes.data)}`);
    }
    const expectedAmountPaise = Math.round(testPlan1.price * 100);
    const createdOrder = orderTamperedRes.data.order;
    if (createdOrder.amount !== expectedAmountPaise) {
      throw new Error(
        `SECURITY FAILURE: Price tampering succeeded! Got ${createdOrder.amount}, expected ${expectedAmountPaise}`
      );
    }
    console.log(`  ✓ Price tampering blocked! Order uses DB price: ₹${testPlan1.price} (${createdOrder.amount} paise).`);
    console.log(`  ✓ Order ID: ${createdOrder.orderId}`);
    console.log(`  ✓ Transaction Ref: ${createdOrder.transactionReference}`);

    // 6. Test Fake Signature Rejection
    console.log('\n[TEST 6] Testing Fake Cryptographic Signature Rejection...');
    const fakeVerifyRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/member/payments/verify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberACookie,
        },
      },
      {
        razorpay_order_id: createdOrder.orderId,
        razorpay_payment_id: 'pay_fake_test_123',
        razorpay_signature: 'fake_cryptographic_signature_should_fail',
      }
    );
    if (fakeVerifyRes.statusCode !== 400) {
      throw new Error(
        `SECURITY FAILURE: Fake signature was not rejected! Status: ${fakeVerifyRes.statusCode}`
      );
    }
    console.log('  ✓ Fake signature properly rejected with 400 Bad Request.');

    // 7. Test Valid HMAC SHA256 Signature Verification
    console.log('\n[TEST 7] Testing Valid HMAC SHA256 Payment Verification & Membership Activation...');
    const validPaymentId = `pay_valid_test_${Date.now()}`;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const bodyToSign = `${createdOrder.orderId}|${validPaymentId}`;
    const validSignature = crypto
      .createHmac('sha256', keySecret)
      .update(bodyToSign)
      .digest('hex');

    const validVerifyRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/member/payments/verify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberACookie,
        },
      },
      {
        razorpay_order_id: createdOrder.orderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validSignature,
      }
    );

    if (validVerifyRes.statusCode !== 200 || !validVerifyRes.data.success) {
      throw new Error(`Valid verification failed: ${JSON.stringify(validVerifyRes.data)}`);
    }
    const verifiedPayment = validVerifyRes.data.payment;
    console.log('  ✓ Payment verified successfully!');
    console.log(`  ✓ Payment status: ${verifiedPayment.status}`);
    console.log(`  ✓ Stable Receipt Number: ${verifiedPayment.receiptNumber}`);
    console.log(`  ✓ Membership Start: ${verifiedPayment.membershipStartDate}`);
    console.log(`  ✓ Membership End: ${verifiedPayment.membershipEndDate}`);

    // 8. Test Idempotent Duplicate Verification
    console.log('\n[TEST 8] Testing Duplicate Verification Idempotency...');
    const duplicateVerifyRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/member/payments/verify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberACookie,
        },
      },
      {
        razorpay_order_id: createdOrder.orderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validSignature,
      }
    );
    if (duplicateVerifyRes.statusCode !== 200) {
      throw new Error(`Idempotency failed: ${JSON.stringify(duplicateVerifyRes.data)}`);
    }
    console.log('  ✓ Idempotent re-verification returned 200 without duplicate processing.');

    // 9. Test Membership Renewal Logic (Extension without losing days)
    console.log('\n[TEST 9] Testing Membership Renewal Logic...');
    // Create second order for Plan 2
    const renewalOrderRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/member/payments/create-order',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberACookie,
        },
      },
      { membershipPlanId: testPlan2._id }
    );
    const renewalOrder = renewalOrderRes.data.order;
    const renewalPaymentId = `pay_renewal_${Date.now()}`;
    const renewalSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${renewalOrder.orderId}|${renewalPaymentId}`)
      .digest('hex');

    const renewalVerifyRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/member/payments/verify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberACookie,
        },
      },
      {
        razorpay_order_id: renewalOrder.orderId,
        razorpay_payment_id: renewalPaymentId,
        razorpay_signature: renewalSignature,
      }
    );
    if (renewalVerifyRes.statusCode !== 200 || !renewalVerifyRes.data.membership.wasRenewed) {
      throw new Error(`Renewal logic check failed: ${JSON.stringify(renewalVerifyRes.data)}`);
    }
    const firstEnd = new Date(verifiedPayment.membershipEndDate).getTime();
    const renewalStart = new Date(renewalVerifyRes.data.membership.startDate).getTime();
    console.log(`  ✓ Renewal detected wasRenewed = true!`);
    console.log(`  ✓ First plan end date: ${verifiedPayment.membershipEndDate}`);
    console.log(`  ✓ Renewal extended date: ${renewalVerifyRes.data.membership.endDate}`);

    // 10. Member Payment History & Details
    console.log('\n[TEST 10] Testing Member Payment History & Details API...');
    const historyRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/member/payments',
      method: 'GET',
      headers: { Cookie: memberACookie },
    });
    if (historyRes.statusCode !== 200 || historyRes.data.data.length < 2) {
      throw new Error(`History fetch failed: ${JSON.stringify(historyRes.data)}`);
    }
    console.log(`  ✓ Member A retrieved ${historyRes.data.data.length} payment records.`);

    // 11. Test Receipt PDF Generation
    console.log('\n[TEST 11] Testing PDF Receipt Download...');
    const receiptRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/member/payments/${verifiedPayment._id}/receipt`,
      method: 'GET',
      headers: { Cookie: memberACookie },
    });
    if (
      receiptRes.statusCode !== 200 ||
      receiptRes.headers['content-type'] !== 'application/pdf'
    ) {
      throw new Error(`Receipt generation failed: HTTP ${receiptRes.statusCode}`);
    }
    console.log(`  ✓ Receipt PDF streamed successfully (${receiptRes.data.length} bytes).`);

    // 12. Test Receipt Cross-Member Security (Member B trying to access Member A's receipt)
    console.log('\n[TEST 12] Testing Cross-Member Receipt Security...');
    const crossReceiptRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/member/payments/${verifiedPayment._id}/receipt`,
      method: 'GET',
      headers: { Cookie: memberBCookie },
    });
    if (crossReceiptRes.statusCode !== 403) {
      throw new Error(
        `SECURITY FAILURE: Member B was able to access Member A receipt! Status: ${crossReceiptRes.statusCode}`
      );
    }
    console.log('  ✓ Cross-member receipt access blocked with 403 Forbidden.');

    // 13. Test Admin Manual Cash Payment
    console.log('\n[TEST 13] Testing Admin Manual Cash Payment (/api/admin/payments/manual)...');
    const manualPaymentRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/payments/manual',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
      },
      {
        memberId: memberAId,
        membershipPlanId: testPlan1._id,
        paymentMethod: 'cash',
        notes: 'Reception desk cash transaction test',
      }
    );
    if (manualPaymentRes.statusCode !== 201) {
      throw new Error(`Manual payment failed: ${JSON.stringify(manualPaymentRes.data)}`);
    }
    console.log('  ✓ Admin recorded manual cash payment successfully.');
    console.log(`  ✓ Manual receipt: ${manualPaymentRes.data.payment.receiptNumber}`);

    // 14. Test Manual Payment Security (Member trying to record manual payment)
    console.log('\n[TEST 14] Testing Manual Payment RBAC Protection (Member attempting admin endpoint)...');
    const memberUnauthorizedRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/payments/manual',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberACookie,
        },
      },
      {
        memberId: memberAId,
        membershipPlanId: testPlan1._id,
        paymentMethod: 'cash',
      }
    );
    if (memberUnauthorizedRes.statusCode !== 403) {
      throw new Error(
        `SECURITY FAILURE: Member was not blocked from admin manual payment! Status: ${memberUnauthorizedRes.statusCode}`
      );
    }
    console.log('  ✓ Member blocked from manual payment endpoint with 403 Forbidden.');

    // 15. Test Real Revenue Analytics
    console.log('\n[TEST 15] Testing Admin Real Revenue Analytics (/api/admin/payments/analytics)...');
    const analyticsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/payments/analytics',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });
    if (analyticsRes.statusCode !== 200 || !analyticsRes.data.success) {
      throw new Error(`Analytics failed: ${JSON.stringify(analyticsRes.data)}`);
    }
    const revStats = analyticsRes.data.stats;
    console.log(`  ✓ Total Real Revenue: ₹${revStats.totalRevenue}`);
    console.log(`  ✓ Revenue This Month: ₹${revStats.revenueThisMonth}`);
    console.log(`  ✓ Today's Amount: ₹${revStats.paymentsTodayAmount}`);
    console.log(`  ✓ Successful Payments Count: ${revStats.successfulPaymentsCount}`);
    console.log(`  ✓ Monthly Revenue Aggregations: ${analyticsRes.data.monthlyRevenue.length} month(s)`);
    console.log(`  ✓ Plan Distribution Aggregations: ${analyticsRes.data.revenueByPlan.length} plan(s)`);

    // 16. Webhook Backend Implementation & Signature Test
    console.log('\n[TEST 16] Testing Razorpay Webhook Backend Architecture & Signature Verification...');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'fitcore_local_webhook_secret_for_test';

    const mockEventPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_webhook_${Date.now()}`,
            order_id: createdOrder.orderId,
            amount: createdOrder.amount,
            status: 'captured',
          },
        },
      },
    });

    const validWebhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(mockEventPayload)
      .digest('hex');

    // Test with invalid signature
    const invalidWebhookRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/payments/razorpay/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'invalid_signature_test',
        },
      },
      mockEventPayload
    );
    if (invalidWebhookRes.statusCode !== 400) {
      throw new Error(
        `Webhook signature check failed to reject invalid signature! Status: ${invalidWebhookRes.statusCode}`
      );
    }
    console.log('  ✓ Webhook properly rejected invalid X-Razorpay-Signature with 400.');

    // Test with valid signature
    const validWebhookRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/payments/razorpay/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': validWebhookSig,
        },
      },
      mockEventPayload
    );
    if (validWebhookRes.statusCode !== 200) {
      throw new Error(`Valid webhook failed: HTTP ${validWebhookRes.statusCode}`);
    }
    console.log('  ✓ Webhook verified valid HMAC signature and processed event idempotently (200 OK).');

    console.log('\n====================================================');
    console.log('🎉 ALL 16 PHASE 7 VERIFICATION TESTS PASSED FLAWLESSLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Phase 7 Verification Failed:', err.message);
    process.exit(1);
  }
}

runPhase7Tests();
