const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  getMyComplaints,
  getMyBrandComplaints,
  resolveComplaintByBrandOwner,
  escalateComplaintByAdmin,
  deleteComplaintByAdmin,
  updateComplaintStatus,
  triggerCronEscalation,
} = require('../controllers/complaintController');
const { protect, optionalProtect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// User Only routes
router.post('/', protect, authorizeRoles('user'), upload.array('evidence', 5), createComplaint);
router.get('/my-complaints', protect, authorizeRoles('user'), getMyComplaints);

// Brand Owner Only routes
router.get('/my-brand', protect, authorizeRoles('brandowner'), getMyBrandComplaints);
router.patch('/:id/resolve', protect, authorizeRoles('brandowner'), resolveComplaintByBrandOwner);

// Admin Only routes
router.patch('/:id/escalate', protect, authorizeRoles('admin'), escalateComplaintByAdmin);
router.delete('/:id', protect, authorizeRoles('admin'), deleteComplaintByAdmin);

// Public / Token routes
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id/status', optionalProtect, updateComplaintStatus);
router.post('/trigger-cron', triggerCronEscalation);

module.exports = router;
