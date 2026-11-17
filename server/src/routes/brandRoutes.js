const express = require('express');
const router = express.Router();
const { getBrands, getBrandBySlug, createBrand } = require('../controllers/brandController');

router.get('/', getBrands);
router.get('/:slug', getBrandBySlug);
router.post('/', createBrand);

module.exports = router;
