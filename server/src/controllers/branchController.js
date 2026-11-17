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

module.exports = {
  findOrCreateBranch,
  getBranches,
  getBranchById,
};
