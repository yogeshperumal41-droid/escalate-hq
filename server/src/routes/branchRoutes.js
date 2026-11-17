const express = require('express');
const router = express.Router();
const { findOrCreateBranch, getBranches, getBranchById } = require('../controllers/branchController');

router.post('/find-or-create', findOrCreateBranch);
router.get('/', getBranches);
router.get('/:id', getBranchById);

module.exports = router;
