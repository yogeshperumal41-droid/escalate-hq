const Brand = require('../models/Brand');
const Branch = require('../models/Branch');
const Complaint = require('../models/Complaint');

/**
 * @desc Get all parent brands with stats
 * @route GET /api/brands
 * @access Public
 */
const getBrands = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const brands = await Brand.find(query).sort({ totalComplaints: -1 });

    res.status(200).json({
      success: true,
      count: brands.length,
      brands,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single brand scorecard by slug with branch leaderboard and category metrics
 * @route GET /api/brands/:slug
 * @access Public
 */
const getBrandBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const brand = await Brand.findOne({ slug: slug.toLowerCase() });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: `Brand with slug '${slug}' not found`,
      });
    }

    // Fetch all branches of this brand
    const branches = await Branch.find({ brandId: brand._id });

    // Identify worst and best performing branches
    // Worst: branches with highest complaints or lowest ratingScore
    const worstBranches = [...branches]
      .filter((b) => b.totalComplaints > 0)
      .sort((a, b) => b.totalComplaints - a.totalComplaints || a.ratingScore - b.ratingScore)
      .slice(0, 5);

    // Best: branches with high resolution rate and better rating
    const bestBranches = [...branches]
      .sort((a, b) => b.ratingScore - a.ratingScore || b.resolvedComplaints - a.resolvedComplaints)
      .slice(0, 5);

    // Complaints breakdown by category
    const categoryStats = await Complaint.aggregate([
      { $match: { brandId: brand._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Status breakdown
    const statusStats = await Complaint.aggregate([
      { $match: { brandId: brand._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Recent complaints for this brand
    const recentComplaints = await Complaint.find({ brandId: brand._id })
      .populate('branchId', 'branchName address city')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      brand,
      metrics: {
        totalBranches: branches.length,
        totalComplaints: brand.totalComplaints,
        resolvedCount: brand.resolvedCount,
        resolutionRate: brand.resolutionRate,
        categoryBreakdown: categoryStats,
        statusBreakdown: statusStats,
        worstBranches,
        bestBranches,
      },
      recentComplaints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create or auto-create a parent brand
 * @route POST /api/brands
 * @access Public (or Admin)
 */
const createBrand = async (req, res, next) => {
  try {
    const { name, category, logoUrl, escalationEmail } = req.body;

    if (!name || !escalationEmail) {
      return res.status(400).json({
        success: false,
        message: 'Brand name and escalation email are required',
      });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let brand = await Brand.findOne({ slug });
    if (brand) {
      return res.status(200).json({
        success: true,
        message: 'Brand already exists',
        brand,
      });
    }

    brand = await Brand.create({
      name,
      slug,
      category: category || 'Other',
      logoUrl: logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e11d48&color=fff&size=128`,
      escalationEmail,
    });

    res.status(201).json({
      success: true,
      brand,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrands,
  getBrandBySlug,
  createBrand,
};
