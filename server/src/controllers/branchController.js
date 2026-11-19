const Branch = require('../models/Branch');
const Brand = require('../models/Brand');

/**
 * @desc Find or create a franchise branch using Google placeId or address & coordinates
 * @route POST /api/branches/find-or-create
 * @access Public / Protected
 */
const findOrCreateBranch = async (req, res, next) => {
  try {
    const {
      brandId,
      brandName,
      branchName,
      address,
      city = 'Bengaluru',
      state = '',
      placeId,
      coordinates, // [longitude, latitude] or { lat, lng }
      ratingScore = 3.5,
    } = req.body;

    let targetBrandId = brandId;

    // If brandId is not provided, look up or auto-create brand by brandName
    if (!targetBrandId && brandName) {
      const slug = brandName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      let brand = await Brand.findOne({ slug });
      if (!brand) {
        brand = await Brand.create({
          name: brandName,
          slug,
          category: 'Other',
          escalationEmail: `grievance@${slug}.com`,
        });
      }
      targetBrandId = brand._id;
    }

    if (!targetBrandId) {
      return res.status(400).json({
        success: false,
        message: 'brandId or brandName is required to link the branch',
      });
    }

    if (!branchName || !address) {
      return res.status(400).json({
        success: false,
        message: 'branchName and address are required',
      });
    }

    // Format coordinates into GeoJSON standard [longitude, latitude]
    let geoCoords = [77.5946, 12.9716]; // Default Bengaluru center fallback
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      geoCoords = [Number(coordinates[0]), Number(coordinates[1])];
    } else if (coordinates && coordinates.lng !== undefined && coordinates.lat !== undefined) {
      geoCoords = [Number(coordinates.lng), Number(coordinates.lat)];
    } else if (coordinates && coordinates.longitude !== undefined && coordinates.latitude !== undefined) {
      geoCoords = [Number(coordinates.longitude), Number(coordinates.latitude)];
    }

    let branch = null;

    // 1. Try matching by Google placeId if available
    if (placeId && placeId.trim() !== '') {
      branch = await Branch.findOne({ placeId });
    }

    // 2. Try matching by branchName and city within the same brand
    if (!branch) {
      branch = await Branch.findOne({
        brandId: targetBrandId,
        city: { $regex: new RegExp(`^${city}$`, 'i') },
        branchName: { $regex: new RegExp(`^${branchName}$`, 'i') },
      });
    }

    // 3. Create if not found
    if (!branch) {
      branch = await Branch.create({
        brandId: targetBrandId,
        branchName,
        address,
        city,
        state,
        placeId: placeId || `custom-${Date.now()}`,
        location: {
          type: 'Point',
          coordinates: geoCoords,
        },
        ratingScore,
      });
      console.log(`[Branch] Created new branch record: ${branch.branchName} in ${branch.city}`);
    }

    const populatedBranch = await Branch.findById(branch._id).populate('brandId', 'name slug category logoUrl escalationEmail');

    res.status(200).json({
      success: true,
      branch: populatedBranch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all branches, with optional brandId, city, or radius filter
 * @route GET /api/branches
 * @access Public
 */
const getBranches = async (req, res, next) => {
  try {
    const { brandId, city, search } = req.query;
    const query = {};

    if (brandId) query.brandId = brandId;
    if (city && city !== 'All') query.city = { $regex: city, $options: 'i' };
    if (search) query.branchName = { $regex: search, $options: 'i' };

    const branches = await Branch.find(query)
      .populate('brandId', 'name slug logoUrl category')
      .sort({ totalComplaints: -1 });

    res.status(200).json({
      success: true,
      count: branches.length,
      branches,
    });
  } catch (error) {
    next(error);
  }
};

const { sendChronicFranchiseReportEmail } = require('../config/mailer');

/**
 * @desc Get single branch by ID with recent complaints
 * @route GET /api/branches/:id
 * @access Public
 */
const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('brandId');
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    res.status(200).json({
      success: true,
      branch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get chronically criticized franchise branches on Google Maps radar
 * @route GET /api/branches/critical
 * @access Public
 */
const getCriticalBranches = async (req, res, next) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 3);
    const { city, brandId, onlyExceeded } = req.query;

    const filter = {};
    if (brandId) filter.brandId = brandId;
    if (city && city !== 'All') filter.city = { $regex: city, $options: 'i' };

    const allBranches = await Branch.find(filter)
      .populate('brandId', 'name slug logoUrl category escalationEmail')
      .sort({ totalComplaints: -1, ratingScore: 1 });

    const processedBranches = allBranches.map((b) => {
      const bObj = b.toObject();
      const isLimitExceeded =
        b.totalComplaints >= limit || b.isCriticallyFlagged || (b.ratingScore && b.ratingScore <= 2.8);
      return {
        ...bObj,
        isLimitExceeded,
        criticalLimitThreshold: limit,
      };
    });

    const finalBranches =
      onlyExceeded === 'true'
        ? processedBranches.filter((b) => b.isLimitExceeded)
        : processedBranches;

    const exceededBranches = processedBranches.filter((b) => b.isLimitExceeded);

    // Calculate city frequency
    const cityCounts = {};
    exceededBranches.forEach((b) => {
      cityCounts[b.city] = (cityCounts[b.city] || 0) + 1;
    });
    const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const totalCorporateAlerts = processedBranches.reduce(
      (acc, curr) => acc + (curr.criticAlertsCount || 0),
      0
    );

    res.status(200).json({
      success: true,
      count: finalBranches.length,
      limitThreshold: limit,
      metrics: {
        totalMonitoredBranches: allBranches.length,
        criticalLimitThreshold: limit,
        exceededBranchesCount: exceededBranches.length,
        totalComplaintsInCritical: exceededBranches.reduce(
          (acc, b) => acc + (b.totalComplaints || 0),
          0
        ),
        topCriticizedCity: topCity,
        totalCorporateAlertsDispatched: totalCorporateAlerts,
      },
      branches: finalBranches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Report a chronically criticized franchise branch that crossed threshold on Google Maps
 * @route POST /api/branches/:id/report-critical
 * @access Public / Authenticated
 */
const reportCriticalBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, limitThreshold = 3, reporterName, reporterEmail } = req.body;

    const branch = await Branch.findById(id).populate(
      'brandId',
      'name slug logoUrl escalationEmail'
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Franchise branch not found',
      });
    }

    const reporterActualName =
      req.user?.name || reporterName || 'Concerned Consumer';
    const reporterActualEmail =
      req.user?.email || reporterEmail || 'consumer@escalatehq.org';

    // Increment alerts count and flag as critical
    branch.criticAlertsCount = (branch.criticAlertsCount || 0) + 1;
    branch.isCriticallyFlagged = true;
    branch.lastCriticalReportAt = new Date();

    if (!branch.criticalReports) {
      branch.criticalReports = [];
    }

    branch.criticalReports.push({
      reportedBy: req.user?._id || null,
      reporterName: reporterActualName,
      reason:
        reason ||
        `Branch has received ${branch.totalComplaints} continuous grievances, exceeding configured tolerance threshold of ${limitThreshold} on Google Maps radar.`,
      limitThreshold: Number(limitThreshold) || 3,
      reportedAt: new Date(),
    });

    await branch.save();

    // Trigger urgent email to the parent brand's corporate escalation desk
    await sendChronicFranchiseReportEmail({
      brand: branch.brandId,
      branch,
      reporterName: reporterActualName,
      reporterEmail: reporterActualEmail,
      reason:
        reason ||
        `Branch exceeds critical complaint tolerance limit (${branch.totalComplaints} complaints vs threshold ${limitThreshold}). Urgent regional audit requested.`,
      limitThreshold,
      criticAlertsCount: branch.criticAlertsCount,
    });

    res.status(200).json({
      success: true,
      message: `Critical grievance notice dispatched to ${branch.brandId?.name || 'Corporate HQ'} escalation directorate.`,
      branch,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findOrCreateBranch,
  getBranches,
  getBranchById,
  getCriticalBranches,
  reportCriticalBranch,
};
