const express = require('express');
const router = express.Router();
const {
    createComplaint, getMyComplaints, getAllComplaints, getComplaintById,
    searchComplaint, updateStatus, assignComplaint, uploadProof,
    submitFeedback, reopenComplaint, upvoteComplaint, addComment, checkDuplicates,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const { validateComplaint, validateStatus, validateFeedback } = require('../middleware/validate');
const { complaintSubmitLimiter } = require('../middleware/rateLimiter');
const upload = require('../config/multer');

// Public route for complaint tracking
router.get('/search', searchComplaint);

// All below require auth
router.use(protect);

router.get('/duplicates/check', checkDuplicates);
router.get('/my', authorize('citizen'), getMyComplaints);
router.get('/all', authorize('admin', 'police', 'municipal'), getAllComplaints);
router.get('/:id', getComplaintById);

router.post(
    '/',
    authorize('citizen'),
    complaintSubmitLimiter,
    upload.array('images', 5),
    validateComplaint,
    createComplaint
);
router.put('/:id/update-status', authorize('admin', 'police', 'municipal'), validateStatus, updateStatus);
router.post('/:id/assign', authorize('admin'), assignComplaint);
router.post('/:id/proof', authorize('admin', 'police', 'municipal'), upload.array('proofImages', 5), uploadProof);
router.post('/:id/feedback', authorize('citizen'), validateFeedback, submitFeedback);
router.post('/:id/reopen', authorize('citizen'), reopenComplaint);
router.post('/:id/upvote', authorize('citizen'), upvoteComplaint);
router.post('/:id/comment', addComment);

module.exports = router;
