require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Brand = require('../models/Brand');
const Branch = require('../models/Branch');
const Complaint = require('../models/Complaint');
const { connectDB, disconnectDB } = require('../config/db');

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Connecting to database...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Brand.deleteMany({}),
      Branch.deleteMany({}),
      Complaint.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Users...');
    const defaultPassword = 'password123';
    const passwordHash = await User.hashPassword(defaultPassword);

    const [user1, user2, brandOwner, adminUser] = await User.create([
      {
        name: 'User',
        email: 'user@example.com',
        passwordHash,
        role: 'user',
      },
      {
        name: 'Rahul Varma',
        email: 'rahul.varma@example.com',
        passwordHash,
        role: 'user',
      },
      {
        name: 'Indian Oil Corporate Desk',
        email: 'owner.indianoil@example.com',
        passwordHash,
        role: 'brandowner',
      },
      {
        name: 'EscalateHQ Platform Auditor',
        email: 'admin@escalatehq.org',
        passwordHash,
        role: 'admin',
      },
    ]);

    console.log('[Seed] Seeding Brands...');
    const [indianoil, sbi, dominos, shell, hdfc] = await Brand.create([
      {
        name: 'Indian Oil',
        slug: 'indian-oil',
        category: 'Petrol Pump / Fuel',
        logoUrl: 'https://images.unsplash.com/photo-1527018607636-080259e7aa69?w=160&auto=format&fit=crop&q=80',
        escalationEmail: 'grievances@indianoil.in',
        totalComplaints: 0,
        resolvedCount: 0,
        averageRating: 3.1,
      },
      {
        name: 'State Bank of India',
        slug: 'sbi',
        category: 'Banking & Finance',
        logoUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=160&auto=format&fit=crop&q=80',
        escalationEmail: 'customercare@sbi.co.in',
        totalComplaints: 0,
        resolvedCount: 0,
        averageRating: 2.8,
      },
      {
        name: "Domino's Pizza",
        slug: 'dominos',
        category: 'Food & Dining',
        logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80',
        escalationEmail: 'guestcare@dominos.in',
        totalComplaints: 0,
        resolvedCount: 0,
        averageRating: 3.8,
      },
      {
        name: 'Shell Petrol Pump',
        slug: 'shell',
        category: 'Petrol Pump / Fuel',
        logoUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=160&auto=format&fit=crop&q=80',
        escalationEmail: 'queries-india@shell.com',
        totalComplaints: 0,
        resolvedCount: 0,
        averageRating: 4.0,
      },
      {
        name: 'HDFC Bank',
        slug: 'hdfc',
        category: 'Banking & Finance',
        logoUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=160&auto=format&fit=crop&q=80',
        escalationEmail: 'grievance.redressal@hdfcbank.com',
        totalComplaints: 0,
        resolvedCount: 0,
        averageRating: 3.4,
      },
    ]);

    // Link brand owner to Indian Oil brand
    await User.findByIdAndUpdate(brandOwner._id, { brandId: indianoil._id });

    console.log('[Seed] Seeding Branches with GeoJSON coordinates...');
    const [iocKoramangala, iocDelhi, dominosIndiranagar, dominosBandra, sbiMgRoad, shellWhitefield] =
      await Branch.create([
        {
          brandId: indianoil._id,
          branchName: 'Indian Oil Retail Outlet - Koramangala 80ft Rd',
          address: 'Plot 42, 80 Feet Road, 4th Block, Koramangala',
          city: 'Bengaluru',
          state: 'Karnataka',
          placeId: 'ChIJX1n94fETrjsRDXk04y_test1',
          location: {
            type: 'Point',
            coordinates: [77.6271, 12.9352], // [lon, lat]
          },
          ratingScore: 2.7,
        },
        {
          brandId: indianoil._id,
          branchName: 'Indian Oil Auto Care - Connaught Place',
          address: 'Outer Circle, Near Block F, Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          placeId: 'ChIJz2b93fETrjsRDXk04y_test2',
          location: {
            type: 'Point',
            coordinates: [77.2167, 28.6304],
          },
          ratingScore: 3.2,
        },
        {
          brandId: dominos._id,
          branchName: "Domino's Pizza - 100ft Road Indiranagar",
          address: '#548, 100 Feet Road, HAL 2nd Stage, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          placeId: 'ChIJy8c21fETrjsRDXk04y_test3',
          location: {
            type: 'Point',
            coordinates: [77.6412, 12.9719],
          },
          ratingScore: 3.9,
        },
        {
          brandId: dominos._id,
          branchName: "Domino's Pizza - Linking Road Bandra West",
          address: 'Ground Floor, Crystal Plaza, Linking Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          placeId: 'ChIJk8b11fETrjsRDXk04y_test4',
          location: {
            type: 'Point',
            coordinates: [72.8364, 19.0596],
          },
          ratingScore: 3.4,
        },
        {
          brandId: sbi._id,
          branchName: 'State Bank of India - MG Road Main Branch',
          address: 'SBI Building, 65 MG Road, Ashok Nagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          placeId: 'ChIJp4d55fETrjsRDXk04y_test5',
          location: {
            type: 'Point',
            coordinates: [77.6094, 12.9754],
          },
          ratingScore: 2.5,
        },
        {
          brandId: shell._id,
          branchName: 'Shell Fuel Station - Whitefield Main Road',
          address: 'Survey 112, ITPL Main Road, Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          placeId: 'ChIJm5e77fETrjsRDXk04y_test6',
          location: {
            type: 'Point',
            coordinates: [77.7499, 12.9698],
          },
          ratingScore: 4.2,
        },
      ]);

    console.log('[Seed] Seeding Realistic Complaints...');

    // Complaint 1: Indian Oil Overcharging & Meter Tampering (Open, Verified GPS)
    const c1 = await Complaint.create({
      ticketId: 'ESC-2026-1042',
      userId: user1._id,
      brandId: indianoil._id,
      branchId: iocKoramangala._id,
      category: 'Overcharging',
      description:
        'Attendant refused to show zero meter before dispensing petrol. When I asked for an itemized tax invoice, the staff became abusive, snatched the payment card, and claimed the automated bill printer was broken. Charged ₹2,500 for an estimated 20 liters in a 15-liter scooter tank!',
      evidenceUrls: [
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1527018607636-080259e7aa69?w=600&auto=format&fit=crop&q=80',
      ],
      isGpsVerified: true,
      userCoordinates: { latitude: 12.9354, longitude: 77.6273 },
      distanceMeters: 32,
      status: 'Open',
      createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
      timeline: [
        {
          action: 'Complaint Registered',
          actor: 'User',
          notes: 'Verified on-site via device GPS (32m from pump).',
          timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
        },
        {
          action: 'Dispatched to Corporate HQ',
          actor: 'EscalateHQ Gateway',
          notes: 'Formal grievance routed to Indian Oil Grievance Directorate (grievances@indianoil.in). 48h SLA timer running.',
          timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
        },
      ],
    });

    // Complaint 2: SBI Rude Staff (Overdue 52 hours -> candidate for SLA breach / Escalated)
    const c2 = await Complaint.create({
      ticketId: 'ESC-2026-0988',
      userId: user2._id,
      brandId: sbi._id,
      branchId: sbiMgRoad._id,
      category: 'Rude Staff',
      description:
        'Counter #3 manager loudly mocked a senior citizen seeking pension KYC renewal. The manager repeatedly shouted "Come back during lunch hour" and slammed the glass counter window, causing emotional distress to elderly patrons.',
      evidenceUrls: [
        'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
      ],
      isGpsVerified: true,
      userCoordinates: { latitude: 12.9755, longitude: 77.6096 },
      distanceMeters: 45,
      status: 'Escalated',
      escalatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 52 * 60 * 60 * 1000), // 52 hours ago -> SLA breached
      timeline: [
        {
          action: 'Complaint Registered',
          actor: 'Rahul Varma',
          notes: 'Verified on-site via device GPS (45m from branch).',
          timestamp: new Date(Date.now() - 52 * 60 * 60 * 1000),
        },
        {
          action: 'Dispatched to Corporate HQ',
          actor: 'EscalateHQ Gateway',
          notes: 'Delivered to customercare@sbi.co.in.',
          timestamp: new Date(Date.now() - 52 * 60 * 60 * 1000),
        },
        {
          action: 'Auto-Escalated (48-Hour SLA Breach)',
          actor: 'EscalateHQ SLA Sentinel Cron',
          notes: 'No response logged within 48h corporate turnaround window. Ticket automatically elevated to Executive Directorate.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ],
    });

    // Complaint 3: Dominos Poor Hygiene (Resolved with refund & corrective audit)
    const c3 = await Complaint.create({
      ticketId: 'ESC-2026-0761',
      userId: user1._id,
      brandId: dominos._id,
      branchId: dominosIndiranagar._id,
      category: 'Poor Hygiene',
      description:
        'Observed kitchen kitchen crew handling raw dough and toppings without hairnets or food-grade gloves. Cockroach crawled across the dine-in counter near the beverage dispenser.',
      evidenceUrls: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      ],
      isGpsVerified: true,
      userCoordinates: { latitude: 12.9720, longitude: 77.6414 },
      distanceMeters: 28,
      status: 'Resolved',
      resolvedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      resolutionNotes:
        'Area Operations Head conducted unannounced pest-control inspection. Branch deep-cleaned, all staff retrained on FSSAI hygiene standards, and full refund credited to customer.',
      resolvedBy: brandOwner._id,
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      timeline: [
        {
          action: 'Complaint Registered',
          actor: 'User',
          notes: 'Verified on-site via device GPS (28m from store).',
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
        },
        {
          action: 'Dispatched to Corporate HQ',
          actor: 'EscalateHQ Gateway',
          notes: 'Delivered to guestcare@dominos.in.',
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
        },
        {
          action: 'Complaint Resolved',
          actor: 'Brand Owner Desk',
          notes: 'Branch audit completed, staff sanctioned, customer compensated.',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        },
      ],
    });

    // Complaint 4: Service Delay at Shell Whitefield (Open, non-verified remote report)
    const c4 = await Complaint.create({
      ticketId: 'ESC-2026-1105',
      userId: user2._id,
      brandId: shell._id,
      branchId: shellWhitefield._id,
      category: 'Service Delay',
      description:
        'Compressed Natural Gas (CNG) dispenser had a line of 35 vehicles with only one attendant on duty. Attendant took unscheduled 40-minute tea breaks while vehicles blocked main road traffic.',
      evidenceUrls: [
        'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=600&auto=format&fit=crop&q=80',
      ],
      isGpsVerified: false,
      userCoordinates: { latitude: 12.9900, longitude: 77.7000 },
      distanceMeters: 6200,
      status: 'Open',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      timeline: [
        {
          action: 'Complaint Registered',
          actor: 'Rahul Varma',
          notes: 'Reported remotely (6.2 km from branch location).',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        {
          action: 'Dispatched to Corporate HQ',
          actor: 'EscalateHQ Gateway',
          notes: 'Delivered to queries-india@shell.com.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      ],
    });

    // Update brand & branch aggregate counts
    await indianoil.updateOne({ totalComplaints: 4, resolvedCount: 0 });
    await sbi.updateOne({ totalComplaints: 3, resolvedCount: 0 });
    await dominos.updateOne({ totalComplaints: 2, resolvedCount: 1 });
    await shell.updateOne({ totalComplaints: 1, resolvedCount: 0 });

    await iocKoramangala.updateOne({
      totalComplaints: 4,
      resolvedComplaints: 0,
      isCriticallyFlagged: true,
      criticAlertsCount: 2,
      lastCriticalReportAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      criticalReports: [
        {
          reportedBy: user1._id,
          reporterName: 'User',
          reason: 'Continuous petrol adulteration and rude cashier behavior on Koramangala 80ft Road.',
          limitThreshold: 3,
          reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
    });
    await sbiMgRoad.updateOne({
      totalComplaints: 3,
      resolvedComplaints: 0,
      isCriticallyFlagged: true,
      criticAlertsCount: 1,
      lastCriticalReportAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      criticalReports: [
        {
          reportedBy: user2._id,
          reporterName: 'Rahul Varma',
          reason: 'Severe service delays and uncooperative staff at SBI MG Road main branch.',
          limitThreshold: 3,
          reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ],
    });
    await dominosIndiranagar.updateOne({ totalComplaints: 2, resolvedComplaints: 1 });
    await shellWhitefield.updateOne({ totalComplaints: 1, resolvedComplaints: 0 });

    console.log('[Seed] Database seeding completed successfully! ✨');
    console.log('--- Test Accounts ---');
    console.log('Customer (user): user@example.com / password123');
    console.log('Brand Owner (brandowner - Indian Oil): owner.indianoil@example.com / password123');
    console.log('Platform Admin (admin): admin@escalatehq.org / password123');
  } catch (error) {
    console.error(`[Seed Error] Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

// If run directly: node src/utils/seedData.js
if (require.main === module) {
  seedDatabase().then(async () => {
    await disconnectDB();
    process.exit(0);
  });
}

module.exports = seedDatabase;
