const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'escalate_hq_super_secure_jwt_secret_key_2026_dev';

/**
 * Protect routes: require valid JWT
 */
const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to proceed.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('-passwordHash')
      .populate('brandId', 'name slug category logoUrl escalationEmail');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please sign in again.',
    });
  }
};

/**
 * Optional protection: attaches user if token exists, but doesn't block if absent
 */
const optionalProtect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Ignore token errors for optional protection
    }
  }

  next();
};

/**
 * Restrict to certain user roles (returns 403 Forbidden on failure)
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Role '${req.user.role}' is not authorized for this resource. Required role(s): [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

const authorize = authorizeRoles;

module.exports = {
  protect,
  optionalProtect,
  authorize,
  authorizeRoles,
};
