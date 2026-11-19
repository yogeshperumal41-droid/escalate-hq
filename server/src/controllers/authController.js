const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Brand = require('../models/Brand');

const JWT_SECRET = process.env.JWT_SECRET || 'escalate_hq_super_secure_jwt_secret_key_2026_dev';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user', brandSlug } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    let brandId = null;
    if (role === 'brandowner' && brandSlug) {
      const brand = await Brand.findOne({ slug: brandSlug.toLowerCase() });
      if (brand) brandId = brand._id;
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: ['user', 'brandowner', 'admin'].includes(role) ? role : 'user',
      brandId,
    });

    const populatedUser = await User.findById(user._id).populate('brandId', 'name slug category logoUrl');
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        brandId: populatedUser.brandId,
        createdAt: populatedUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .populate('brandId', 'name slug category logoUrl');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        brandId: user.brandId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get current authenticated user profile
 * @route GET /api/auth/me
 * @access Protected
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @desc Get pre-seeded demo accounts for quick role-switching in the UI
 * @route GET /api/auth/demo-accounts
 * @access Public
 */
const getDemoAccounts = async (req, res) => {
  res.status(200).json({
    success: true,
    accounts: [
      {
        role: 'user',
        label: 'Consumer / User',
        email: 'user@example.com',
        password: 'password123',
        description: 'Files grievances with GPS proof & tracks personal cases',
      },
      {
        role: 'brandowner',
        label: 'Indian Oil Brand Owner Desk',
        email: 'owner.indianoil@example.com',
        password: 'password123',
        description: 'Franchise corporate desk to review & resolve brand tickets',
      },
      {
        role: 'admin',
        label: 'EscalateHQ Platform Admin',
        email: 'admin@escalatehq.org',
        password: 'password123',
        description: 'Platform auditor: manages brands, users, and ticket moderation',
      },
    ],
  });
};

module.exports = {
  register,
  login,
  getMe,
  getDemoAccounts,
};
