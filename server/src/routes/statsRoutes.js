const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Brand = require('../models/Brand');
const Branch = require('../models/Branch');
const { getEmailLogs } = require('../config/mailer');

/**
 * @desc Get global platform overview metrics for dashboard hero
 * @route GET /api/stats/overview
 * @access Public
 */
router.get('/overview', async (req, res, next) => {
  try {
    const [
      totalComplaints,
      resolvedComplaints,
      escalatedComplaints,
      openComplaints,
      gpsVerifiedCount,
      totalBrands,
      totalBranches,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Escalated' }),
      Complaint.countDocuments({ status: 'Open' }),
      Complaint.countDocuments({ isGpsVerified: true }),
      Brand.countDocuments(),
      Branch.countDocuments(),
    ]);

    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;
    const gpsVerifiedRate =
      totalComplaints > 0 ? Math.round((gpsVerifiedCount / totalComplaints) * 100) : 0;

    // Category breakdown
    const categoryBreakdown = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top cities
    const cityBreakdown = await Branch.aggregate([
      { $group: { _id: '$city', totalBranches: { $sum: 1 }, totalComplaints: { $sum: '$totalComplaints' } } },
      { $sort: { totalComplaints: -1 } },
      { $limit: 6 },
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        totalComplaints,
        resolvedComplaints,
        escalatedComplaints,
        openComplaints,
        gpsVerifiedCount,
        gpsVerifiedRate,
        resolutionRate,
        totalBrands,
        totalBranches,
        categoryBreakdown,
        cityBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc Get email audit log (for previewing emails dispatched to corporate desks)
 * @route GET /api/stats/email-logs
 * @access Public
 */
router.get('/email-logs', (req, res) => {
  res.status(200).json({
    success: true,
    count: getEmailLogs().length,
    logs: getEmailLogs(),
  });
});

module.exports = router;
