const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  triggerCronEscalation,
} = require('../controllers/complaintController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.array('evidence', 5), createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id/status', optionalProtect, updateComplaintStatus);
router.post('/trigger-cron', triggerCronEscalation);

module.exports = router;
