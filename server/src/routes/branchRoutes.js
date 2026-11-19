const express = require('express');
const router = express.Router();
const {
  findOrCreateBranch,
  getBranches,
  getBranchById,
  getCriticalBranches,
  reportCriticalBranch,
} = require('../controllers/branchController');
const { optionalProtect } = require('../middleware/authMiddleware');

router.post('/find-or-create', findOrCreateBranch);
router.get('/', getBranches);
router.get('/critical', getCriticalBranches);
router.post('/:id/report-critical', optionalProtect, reportCriticalBranch);
router.get('/:id', getBranchById);

module.exports = router;
