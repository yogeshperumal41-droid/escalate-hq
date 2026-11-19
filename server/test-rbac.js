const API = 'http://localhost:5001/api';

async function req(path, options = {}) {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {}
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 Starting Strict RBAC Verification Suite');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // 1. Login all 3 roles
    const userRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123',
      }),
    });
    const userToken = userRes.data.token;
    assert(userRes.data.user.role === 'user', "User has role 'user'");

    const ownerRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'owner.indianoil@example.com',
        password: 'password123',
      }),
    });
    const ownerToken = ownerRes.data.token;
    assert(ownerRes.data.user.role === 'brandowner', "Indian Oil Desk has role 'brandowner'");
    assert(Boolean(ownerRes.data.user.brandId), "Brand Owner has linked brandId");

    const adminRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@escalatehq.org',
        password: 'password123',
      }),
    });
    const adminToken = adminRes.data.token;
    assert(adminRes.data.user.role === 'admin', "Auditor has role 'admin'");

    // Fetch initial brands and branches for testing
    const brandsRes = await req('/brands');
    const branchesRes = await req('/branches');
    const indianoilBrand = brandsRes.data.brands.find((b) => b.slug === 'indian-oil');
    const indianoilBranch = branchesRes.data.branches.find(
      (b) => (b.brandId?._id || b.brandId)?.toString() === indianoilBrand._id.toString()
    ) || branchesRes.data.branches[0];

    console.log('\n--- 2. USER ONLY PERMISSION TESTS ---');

    // Test 2a: User can file complaint
    let filedComplaintId = null;
    const fileRes = await req('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        brandId: indianoilBrand._id,
        branchId: indianoilBranch._id,
        category: 'Overcharging',
        description: 'Automated test grievance filed by customer user role.',
      }),
    });
    assert(fileRes.status === 201, 'User CAN submit new complaint (201 Created)');
    filedComplaintId = fileRes.data.complaint?._id;

    // Test 2b: User can fetch personal complaints
    const myCompRes = await req('/complaints/my-complaints', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(myCompRes.status === 200 && myCompRes.data.complaints.length > 0, 'User CAN fetch My Complaints (200 OK)');

    // Test 2c: Brand Owner CANNOT file complaint (403)
    const ownerFileRes = await req('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        brandId: indianoilBrand._id,
        branchId: indianoilBranch._id,
        category: 'Overcharging',
        description: 'Brand owner trying to file complaint',
      }),
    });
    assert(ownerFileRes.status === 403, 'Brand Owner CANNOT file complaint (403 Forbidden)');

    // Test 2d: Admin CANNOT file complaint (403)
    const adminFileRes = await req('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        brandId: indianoilBrand._id,
        branchId: indianoilBranch._id,
        category: 'Overcharging',
        description: 'Admin trying to file complaint',
      }),
    });
    assert(adminFileRes.status === 403, 'Admin CANNOT file complaint (403 Forbidden)');

    console.log('\n--- 3. BRAND OWNER ONLY PERMISSION TESTS ---');

    // Test 3a: Brand Owner can fetch their brand complaints
    const brandCompRes = await req('/complaints/my-brand', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(brandCompRes.status === 200, "Brand Owner CAN fetch 'my-brand' complaints (200 OK)");

    // Test 3b: User CANNOT fetch 'my-brand' (403)
    const userBrandRes = await req('/complaints/my-brand', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userBrandRes.status === 403, "User CANNOT access 'my-brand' (403 Forbidden)");

    // Test 3c: Brand Owner can resolve complaints for their brand
    if (filedComplaintId) {
      const resolveRes = await req(`/complaints/${filedComplaintId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          resolutionNotes: 'Refund issued and meter recalibrated by Indian Oil.',
        }),
      });
      assert(resolveRes.status === 200 && resolveRes.data.complaint?.status === 'Resolved', "Brand Owner CAN resolve their brand's complaint (200 OK)");
    }

    // Test 3d: Brand Owner CANNOT resolve another brand's complaint (403)
    const allComplaints = (await req('/complaints')).data.complaints;
    const otherBrandComp = allComplaints.find(
      (c) => (c.brandId?._id || c.brandId) !== indianoilBrand._id && c.status !== 'Resolved'
    );
    if (otherBrandComp) {
      const otherResolveRes = await req(`/complaints/${otherBrandComp._id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          resolutionNotes: 'Attempting to resolve another brand',
        }),
      });
      assert(otherResolveRes.status === 403, "Brand Owner CANNOT resolve another brand's complaint (403 Forbidden)");
    }

    // Test 3e: User CANNOT resolve complaint (403)
    if (filedComplaintId) {
      const userResolveRes = await req(`/complaints/${filedComplaintId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({
          resolutionNotes: 'Customer attempting to resolve',
        }),
      });
      assert(userResolveRes.status === 403, 'User CANNOT call resolve endpoint (403 Forbidden)');
    }

    console.log('\n--- 4. ADMIN ONLY PERMISSION TESTS ---');

    // Test 4a: Admin can create parent brand
    let createdBrandId = null;
    const createBrandRes = await req('/brands', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'KFC India Test Brand',
        category: 'Food & Dining',
        escalationEmail: 'grievance@kfc.in',
      }),
    });
    assert(createBrandRes.status === 201, 'Admin CAN create parent brand (201 Created)');
    createdBrandId = createBrandRes.data.brand?._id;

    // Test 4b: User CANNOT create parent brand (403)
    const userBrandCreateRes = await req('/brands', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        name: 'Fake Brand by User',
        escalationEmail: 'fake@brand.com',
      }),
    });
    assert(userBrandCreateRes.status === 403, 'User CANNOT create parent brand (403 Forbidden)');

    // Test 4c: Brand Owner CANNOT create parent brand (403)
    const ownerBrandCreateRes = await req('/brands', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        name: 'Fake Brand by Brand Owner',
        escalationEmail: 'fake@brand.com',
      }),
    });
    assert(ownerBrandCreateRes.status === 403, 'Brand Owner CANNOT create parent brand (403 Forbidden)');

    // Test 4d: Admin can delete parent brand
    if (createdBrandId) {
      const delBrandRes = await req(`/brands/${createdBrandId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(delBrandRes.status === 200, 'Admin CAN delete parent brand (200 OK)');
    }

    // Test 4e: Admin can force-escalate complaint
    const openComp = allComplaints.find((c) => c.status === 'Open');
    if (openComp) {
      const escRes = await req(`/complaints/${openComp._id}/escalate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ reason: 'Administrative SLA enforcement' }),
      });
      assert(escRes.status === 200 && escRes.data.complaint?.status === 'Escalated', 'Admin CAN force-escalate complaint (200 OK)');
    }

    // Test 4f: User CANNOT force-escalate complaint (403)
    if (openComp) {
      const userEscRes = await req(`/complaints/${openComp._id}/escalate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ reason: 'User attempting escalation' }),
      });
      assert(userEscRes.status === 403, 'User CANNOT force-escalate complaint (403 Forbidden)');
    }

    // Test 4g: Admin can get user list
    const usersRes = await req('/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(usersRes.status === 200 && usersRes.data.users?.length >= 3, 'Admin CAN get all users (200 OK)');

    // Test 4h: User CANNOT access /api/admin/users (403)
    const userAdminRes = await req('/admin/users', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userAdminRes.status === 403, 'User CANNOT access /api/admin/users (403 Forbidden)');

    // Test 4i: Admin can update user role & assign brand
    const updateRoleRes = await req(`/admin/users/${userRes.data.user.id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'user' }),
    });
    assert(updateRoleRes.status === 200, 'Admin CAN update user role and assigned brand (200 OK)');

    // Test 4j: Admin can delete spam ticket
    if (filedComplaintId) {
      const delTicketRes = await req(`/complaints/${filedComplaintId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(delTicketRes.status === 200, 'Admin CAN delete spam ticket (200 OK)');
    }

    console.log('\n--- 5. GOOGLE MAP CRITICAL FRANCHISE RADAR TESTS ---');
    // Test 5a: Fetch critical branches with threshold limit = 3
    const critRes = await req('/branches/critical?limit=3');
    assert(critRes.status === 200 && Array.isArray(critRes.data.branches), 'Public CAN fetch critical branches list on radar (200 OK)');
    assert(critRes.data.metrics && critRes.data.metrics.criticalLimitThreshold === 3, 'Radar correctly computes limit threshold metrics');

    // Test 5b: Report a chronic branch exceeding limit
    if (critRes.data.branches?.length > 0) {
      const targetBranch = critRes.data.branches[0];
      const reportRes = await req(`/branches/${targetBranch._id}/report-critical`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({
          reason: 'Severe recurring issues with staff overcharging and attitude. Limit exceeded.',
          limitThreshold: 3,
        }),
      });
      assert(reportRes.status === 200 && reportRes.data.success, 'User CAN report chronic franchise exceeding critical limit to corporate HQ (200 OK)');
    }

    console.log('\n==================================================');
    console.log(`📊 Suite Results: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('Fatal error during test suite:', err.message);
  }
}

runTests();
