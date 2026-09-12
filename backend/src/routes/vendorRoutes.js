const express = require('express');
const router = express.Router();
const multer = require('multer');
const vendorController = require('../controllers/vendorController');

// Multer configured for memory storage (Vercel serverless friendly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// POST /api/vendor/verify - Public self-service pre-screening with cross-validation
router.post('/verify', upload.single('document'), vendorController.verifyVendorDocument);

// POST /api/vendor/submit - Submit actual application
router.post('/submit', upload.single('document'), vendorController.submitApplication);

// GET /api/vendor/track/:id - Get submission status
router.get('/track/:id', vendorController.trackSubmission);

// GET /api/vendor/tenders - Open CPCL tenders listing
router.get('/tenders', vendorController.getOpenTenders);

// GET /api/vendor/alerts - Vendor defect curing alerts history
router.get('/alerts', vendorController.getVendorAlerts);

// POST /api/vendor/profile - Save or update vendor profile
router.post('/profile', vendorController.saveVendorProfile);

module.exports = router;
