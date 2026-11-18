const express = require('express');
const router = express.Router();
const {
  getBrands,
  getBrandBySlug,
  createBrand,
  deleteBrand,
} = require('../controllers/brandController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', getBrands);
router.get('/:slug', getBrandBySlug);
router.post('/', protect, authorizeRoles('admin'), createBrand);
router.delete('/:id', protect, authorizeRoles('admin'), deleteBrand);

module.exports = router;
