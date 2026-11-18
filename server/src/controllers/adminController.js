const User = require('../models/User');
const Brand = require('../models/Brand');

/**
 * @desc Get all registered users for administration
 * @route GET /api/admin/users
 * @access Protected (admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .populate('brandId', 'name slug category logoUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update a user's role and assigned brand
 * @route PATCH /api/admin/users/:id/role
 * @access Protected (admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, brandId } = req.body;

    if (!role || !['user', 'brandowner', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role must strictly be one of: 'user', 'brandowner', 'admin'.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;

    if (role === 'brandowner') {
      if (brandId) {
        const brand = await Brand.findById(brandId);
        if (!brand) {
          return res.status(404).json({ success: false, message: 'Assigned brand not found' });
        }
        user.brandId = brand._id;
      }
    } else {
      user.brandId = null;
    }

    await user.save();

    const updated = await User.findById(id)
      .select('-passwordHash')
      .populate('brandId', 'name slug category logoUrl');

    res.status(200).json({
      success: true,
      message: `User '${user.name}' role updated to '${role}'.`,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
};
