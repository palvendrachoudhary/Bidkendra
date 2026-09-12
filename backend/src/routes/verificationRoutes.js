const express = require('express');
const { verifyBidder, getVerificationStatus, verifyDocument, getComplianceScore, processBulkDocuments, sendWebhookNotification } = require('../controllers/verificationController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Public route — no auth required (called by frontend for Viasocket webhook)
router.post('/notify', sendWebhookNotification);

// All routes below require JWT authentication
router.use(protect);

router.post('/bidder/:bidderId', authorize('ADMIN', 'OFFICER'), verifyBidder);
router.get('/status/:submissionId', getVerificationStatus);
router.post('/document', upload.single('document'), verifyDocument);
router.post('/bulk', upload.array('documents', 10), processBulkDocuments);
router.get('/score/:submissionId', getComplianceScore);

module.exports = router;
