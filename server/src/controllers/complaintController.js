const Complaint = require('../models/Complaint');
const Brand = require('../models/Brand');
const Branch = require('../models/Branch');
const { uploadEvidenceFile } = require('../config/s3');
const { verifyGpsProximity } = require('../utils/geoUtils');
const { sendComplaintFiledEmail, sendEscalationAlertEmail } = require('../config/mailer');

/**
 * @desc File a new complaint with AWS S3 proof upload, GPS proximity check, and corporate email alert
 * @route POST /api/complaints
 * @access Protected
 */
const createComplaint = async (req, res, next) => {
  try {
    const {
      brandId,
      branchId,
      category,
      description,
      userLat,
      userLng,
    } = req.body;

    if (!brandId || !branchId || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'brandId, branchId, category, and description are required',
      });
    }

    // Verify brand and branch existence
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // 1. Handle Proof Uploads (AWS S3 with local fallback)
    const evidenceUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadEvidenceFile(file, 'proofs');
        if (url) evidenceUrls.push(url);
      }
    }

    // 2. Perform GPS Proximity Verification
    let isGpsVerified = false;
    let distanceMeters = null;
    let userCoordinates = null;

    if (userLat !== undefined && userLng !== undefined && userLat !== '' && userLng !== '') {
      userCoordinates = {
        latitude: Number(userLat),
        longitude: Number(userLng),
      };

      const proximityResult = verifyGpsProximity(
        userCoordinates,
        branch.location ? branch.location.coordinates : null,
        750 // 750-meter threshold
      );

      isGpsVerified = proximityResult.isVerified;
      distanceMeters = proximityResult.distanceMeters;
      console.log(`[GPS Verification] User coords: [${userLat}, ${userLng}] vs Branch coords. Result: ${proximityResult.reason}`);
    }

    // 3. Save Complaint
    const complaint = new Complaint({
      userId: req.user._id,
      brandId: brand._id,
      branchId: branch._id,
      category,
      description,
      evidenceUrls,
      isGpsVerified,
      userCoordinates,
      distanceMeters,
      status: 'Open',
      timeline: [
        {
          action: 'Complaint Registered',
          actor: req.user.name,
          notes: isGpsVerified
            ? `Verified on-site via device GPS (${distanceMeters}m from branch).`
            : `Filed remotely${distanceMeters ? ` (${distanceMeters}m away from branch)` : ''}.`,
          timestamp: new Date(),
        },
        {
          action: 'Dispatched to Corporate HQ',
          actor: 'EscalateHQ Gateway',
          notes: `Formal grievance delivered to corporate email: ${brand.escalationEmail}. 48-hour SLA countdown initiated.`,
          timestamp: new Date(),
        },
      ],
    });

    await complaint.save();

    // 4. Increment complaint counters on Brand and Branch
    await Brand.findByIdAndUpdate(brand._id, { $inc: { totalComplaints: 1 } });
    await Branch.findByIdAndUpdate(branch._id, { $inc: { totalComplaints: 1 } });

    // 5. Send automated Nodemailer notification to corporate grievance email
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resolveUrl = `${clientBaseUrl}/complaints/${complaint._id}?token=${complaint.resolveToken}&action=resolve`;

    // Fire & forget or await email
    sendComplaintFiledEmail({
      brand,
      branch,
      complaint,
      user: req.user,
      resolveUrl,
    }).catch((err) => console.error('[Email Notification Error]', err.message));

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('brandId', 'name slug category logoUrl escalationEmail')
      .populate('branchId', 'branchName address city state location ratingScore')
      .populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Complaint successfully filed and routed to corporate headquarters.',
      complaint: populatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get public feed of complaints with filtering, sorting & pagination
 * @route GET /api/complaints
 * @access Public
 */
const getComplaints = async (req, res, next) => {
  try {
    const {
      brandId,
      branchId,
      city,
      category,
      status,
      isGpsVerified,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (brandId) query.brandId = brandId;
    if (branchId) query.branchId = branchId;
    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (isGpsVerified === 'true') query.isGpsVerified = true;

    // Filter by city requires matching branchId in that city
    if (city && city !== 'All') {
      const branchesInCity = await Branch.find({
        city: { $regex: city, $options: 'i' },
      }).select('_id');
      const branchIds = branchesInCity.map((b) => b._id);
      query.branchId = { $in: branchIds };
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('brandId', 'name slug category logoUrl')
        .populate('branchId', 'branchName address city state location ratingScore')
        .populate('userId', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single complaint by ID with full timeline, proof & branch info
 * @route GET /api/complaints/:id
 * @access Public
 */
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('brandId', 'name slug category logoUrl escalationEmail')
      .populate('branchId', 'branchName address city state location ratingScore totalComplaints resolvedComplaints')
      .populate('userId', 'name email role')
      .populate('resolvedBy', 'name email role');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update complaint status (Resolved / Escalated / Open)
 *       Allowed for: brand_admin, super_admin, or anyone with the unique email resolveToken!
 * @route PATCH /api/complaints/:id/status
 * @access Public with token OR Protected
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes = '', token } = req.body;

    if (!status || !['Open', 'Escalated', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: 'Open', 'Escalated', 'Resolved'",
      });
    }

    const complaint = await Complaint.findById(id)
      .populate('brandId')
      .populate('branchId')
      .populate('userId');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Permission Check:
    // 1. Authorized if request has valid resolveToken matching complaint.resolveToken
    // 2. OR logged in user is super_admin
    // 3. OR logged in user is brand_admin matching the complaint's brandId
    let isAuthorized = false;
    let actorName = 'Brand Representative';

    if (token && token === complaint.resolveToken) {
      isAuthorized = true;
      actorName = 'Corporate Grievance Officer (via Email Resolution Link)';
    } else if (req.user) {
      if (req.user.role === 'super_admin') {
        isAuthorized = true;
        actorName = `Super Admin (${req.user.name})`;
      } else if (req.user.role === 'brand_admin') {
        // If brand_admin is bound to a brand, verify match
        if (!req.user.brandId || req.user.brandId.toString() === complaint.brandId._id.toString()) {
          isAuthorized = true;
          actorName = `Brand Admin (${req.user.name})`;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You need a valid resolution token or Brand Admin privileges to update this ticket status.',
      });
    }

    const previousStatus = complaint.status;
    complaint.status = status;

    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
      complaint.resolutionNotes = resolutionNotes || 'Grievance addressed and marked resolved by corporate representative.';
      if (req.user) complaint.resolvedBy = req.user._id;

      // Update counters if previous status was not Resolved
      if (previousStatus !== 'Resolved') {
        await Brand.findByIdAndUpdate(complaint.brandId._id, { $inc: { resolvedCount: 1 } });
        await Branch.findByIdAndUpdate(complaint.branchId._id, { $inc: { resolvedComplaints: 1 } });
      }

      complaint.timeline.push({
        action: 'Complaint Resolved',
        actor: actorName,
        notes: resolutionNotes || 'Issue addressed and resolved satisfactorily.',
        timestamp: new Date(),
      });
    } else if (status === 'Escalated') {
      complaint.escalatedAt = new Date();
      complaint.timeline.push({
        action: 'Manual Escalation Triggered',
        actor: actorName,
        notes: resolutionNotes || 'Grievance escalated for higher-level intervention.',
        timestamp: new Date(),
      });
    } else if (status === 'Open') {
      complaint.timeline.push({
        action: 'Re-opened Ticket',
        actor: actorName,
        notes: resolutionNotes || 'Ticket reopened for further review.',
        timestamp: new Date(),
      });
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(id)
      .populate('brandId', 'name slug category logoUrl escalationEmail')
      .populate('branchId', 'branchName address city state location ratingScore')
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      message: `Complaint status successfully updated to '${status}'.`,
      complaint: updatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Manually trigger 48h SLA cron escalation check (Handy for testing & demos!)
 * @route POST /api/complaints/trigger-cron
 * @access Public or Protected
 */
const triggerCronEscalation = async (req, res, next) => {
  try {
    const { runEscalationJob } = require('../cron/escalationCron');
    const result = await runEscalationJob();

    res.status(200).json({
      success: true,
      message: 'Escalation cron job executed successfully',
      result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  triggerCronEscalation,
};
