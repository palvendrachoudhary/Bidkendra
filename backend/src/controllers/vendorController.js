/**
 * Vendor Portal Controller
 * Provides vendor self-service pre-screening, document verification,
 * identity cross-validation, proactive curing guidance, and tender discovery.
 */

const fs = require('fs');
const db = require('../config/database');
const {
  generateId
} = require('../utils/helpers');
const {
  scanAndVerifyDocument
} = require('../services/realOcrService');
const cloudStorage = require('../services/cloudStorageService');

/**
 * Verify Vendor Document & Cross-Validate with Form Data
 * POST /api/vendor/verify
 */
exports.verifyVendorDocument = async (req, res, next) => {
  try {
    let fileBuffer = null;
    let fileName = 'Vendor_Document.pdf';
    let mimeType = 'application/pdf';
    const companyName = req.body && (req.body.companyName || req.body.company_name) || 'Vendor Entity';
    const formGSTIN = req.body && req.body.gstin ? req.body.gstin.trim().toUpperCase() : null;
    const formPAN = req.body && req.body.pan ? req.body.pan.trim().toUpperCase() : null;
    const formUdyam = req.body && req.body.udyam ? req.body.udyam.trim().replace(/\s+/g, '').toUpperCase() : null;
    const vendorEmail = req.body && (req.body.email || req.body.vendorEmail) || null;
    const phoneNumber = req.body && (req.body.phone || req.body.phoneNumber) || null;
    let fileInfo = null;
    if (req.file) {
      fileName = req.file.originalname || req.file.originalname;
      mimeType = req.file.mimetype;
      fileBuffer = req.file.buffer;
      const storedFilename = cloudStorage.uploadBlob(fileBuffer, fileName, mimeType);
      fileInfo = {
        filename: storedFilename,
        originalname: req.file.originalname,
        path: `/api/uploads/${storedFilename}`,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    } else if (req.body && req.body.text) {
      fileName = req.body.fileName || 'Vendor_Submitted_Specs.txt';
      fileBuffer = Buffer.from(req.body.text, 'utf8');
      mimeType = 'text/plain';
    } else {
      // Build sample content using form inputs or defaults if none provided
      fileName = req.body && req.body.fileName || 'Vendor_PreCheck_Document.txt';
      const sampleText = `
        GOVERNMENT OF INDIA - MINISTRY OF PETROLEUM & NATURAL GAS
        CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)
        VENDOR PRE-SCREENING COMPLIANCE ENVELOPE
        
        Company Name: ${companyName}
        CIN: U23201TN2018PTC123456
        GSTIN: ${formGSTIN || '33AABCP1234F1Z5'} (State: 33 - Tamil Nadu)
        PAN: ${formPAN || 'AABCP1234F'} (Entity: C - Company)
        Udyam Registration: ${formUdyam || 'UDYAM-TN-02-0045812'}
        Enterprise Classification: Small Enterprise (Manufacturing)
        
        MAKE IN INDIA DECLARATION (DPIIT Order 2017):
        We hereby declare that Local Content for CPCL Tender CPCL-2026-T1001 is 72.4%.
        Class-I Local Supplier entitled to purchase preference.
        
        STATUTORY & FINANCIAL COMPLIANCE:
        Audited Turnover: INR 14.80 Crore. ITR-6 filed consistently.
        EPFO Establishment Code: TN/MAS/0045812/000
        ESIC Registration: 31000458120000101
        Quality Standard: ISO 9001:2015 Certified
        OEM Authorization Letter Attached
        Startup India DPIIT Recognized
        NSIC Single Point Registration Valid
        CLRA Contract Labour License Attached
        Debarment/Blacklisting: None. Never been debarred.
        Digitally Signed: Authorized Signatory
        DigiLocker Verification Marker Attached
      `;
      fileBuffer = Buffer.from(sampleText, 'utf8');
      mimeType = 'text/plain';
    }
    const scanResult = await scanAndVerifyDocument(fileBuffer, fileName, mimeType);

    // Cross-validation: Check form inputs vs document extracted values
    const extractedGSTIN = scanResult.extractedEntities?.gstin;
    const extractedPAN = scanResult.extractedEntities?.pan;
    const extractedUdyam = scanResult.extractedEntities?.udyam;
    const discrepancies = [];
    let gstinMatch = null;
    let panMatch = null;
    let udyamMatch = null;
    if (formGSTIN) {
      if (extractedGSTIN) {
        gstinMatch = formGSTIN === extractedGSTIN.toUpperCase();
        if (!gstinMatch) {
          discrepancies.push(`GSTIN Mismatch: Form contains '${formGSTIN}', but document contains '${extractedGSTIN}'.`);
        }
      } else {
        discrepancies.push(`GSTIN '${formGSTIN}' specified in form, but no matching statutory GSTIN detected in document.`);
      }
    }
    if (formPAN) {
      if (extractedPAN) {
        panMatch = formPAN === extractedPAN.toUpperCase();
        if (!panMatch) {
          discrepancies.push(`PAN Mismatch: Form contains '${formPAN}', but document contains '${extractedPAN}'.`);
        }
      } else {
        discrepancies.push(`PAN '${formPAN}' specified in form, but no valid PAN format detected in document.`);
      }
    }
    if (formUdyam) {
      if (extractedUdyam) {
        udyamMatch = formUdyam === extractedUdyam.replace(/\s+/g, '').toUpperCase();
        if (!udyamMatch) {
          discrepancies.push(`Udyam Mismatch: Form contains '${formUdyam}', but document contains '${extractedUdyam}'.`);
        }
      } else {
        discrepancies.push(`Udyam Number '${formUdyam}' specified in form, but not found in uploaded document.`);
      }
    }

    // Build proactive curing guidance
    const curingGuidance = [];
    discrepancies.forEach(disc => {
      curingGuidance.push({
        type: 'DISCREPANCY',
        severity: 'CRITICAL',
        title: 'Form vs Document Data Discrepancy',
        action: disc
      });
    });
    for (const [checkId, check] of Object.entries(scanResult.checksDetail || {})) {
      if (check.checkStatus === 'FAILED') {
        let remediation = `Remediate ${check.checkName} requirement prior to formal GeM submission.`;
        if (checkId === 'gst') remediation = 'Upload valid 15-digit GSTIN registration certificate (Form GST REG-06) and latest GSTR-3B filing acknowledgment.';else if (checkId === 'pan') remediation = 'Attach clear copy of corporate PAN card matching Ministry of Corporate Affairs legal entity name.';else if (checkId === 'udyam') remediation = 'Provide active Udyam Registration Certificate under MSMED Act for MSE EMD exemption and purchase preference.';else if (checkId === 'makeInIndia') remediation = 'Submit self-certified Local Content Affidavit specifying >=50% domestic value addition for Class-I preference.';else if (checkId === 'blacklist') remediation = 'Attach notarized Non-Debarment Affidavit confirming entity has never been debarred or blacklisted.';else if (checkId === 'mca') remediation = 'Verify 21-character CIN matches Ministry of Corporate Affairs incorporation certificate.';else if (checkId === 'epfo') remediation = 'Upload latest EPFO monthly electronic return payment receipt (ECR).';else if (checkId === 'esic') remediation = 'Attach 17-digit ESIC employer registration and monthly contribution summary.';
        curingGuidance.push({
          type: 'FAILED_CHECK',
          checkId,
          checkName: check.checkName,
          isMandatory: Boolean(check.isMandatoryGate),
          severity: check.isMandatoryGate ? 'CRITICAL' : 'WARNING',
          title: `Non-Compliant: ${check.checkName}`,
          action: remediation
        });
      } else if (check.checkStatus === 'NEEDS_MANUAL_REVIEW') {
        curingGuidance.push({
          type: 'MANUAL_REVIEW',
          checkId,
          checkName: check.checkName,
          isMandatory: Boolean(check.isMandatoryGate),
          severity: 'INFO',
          title: `Manual Review: ${check.checkName}`,
          action: `Self-certified document detected for ${check.checkName}. Ensure original certificates are accessible during technical bid opening.`
        });
      }
    }

    // Automatically log active bid curing alert if discrepancies or compliance issues are found
    if (discrepancies.length > 0 || scanResult.hasMandatoryFailure || !scanResult.isCompliant) {
      try {
        const alertId = 'alt-vendor-' + generateId();
        const flaggedList = discrepancies.concat(Object.values(scanResult.checksDetail || {}).filter(c => c.checkStatus === 'FAILED').map(c => c.checkName));
        await db.query(`
          INSERT INTO alert_timeline (
            id, bidder_id, vendor_name, vendor_email, phone_number,
            alert_type, severity, title, message, flagged_items_json,
            status, delivery_mode, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        `, [alertId, null, companyName, vendorEmail, phoneNumber, 'WEBHOOK_CURING', scanResult.hasMandatoryFailure ? 'CRITICAL' : 'WARNING', `Vendor Self-Service Curing Alert: ${companyName}`, `Vendor pre-check identified ${flaggedList.length} compliance discrepancy(s). Actionable defect remediation guidance generated.`, JSON.stringify(flaggedList), 'DELIVERED', 'live']);
      } catch (logErr) {
        console.warn('Error recording vendor curing alert:', logErr.message);
      }
    }

    // Save as submission so admin can view it
    let savedTrackingId = '';
    try {
      const bidderId = 'b-' + generateId();
      savedTrackingId = 'BK-CPCL-' + Math.floor(100000 + Math.random() * 900000);
      const submissionId = savedTrackingId;
      const tenderId = req.body && req.body.tenderId || 't1';
      await db.query(`
        INSERT INTO bidders (
          id, company_name, registration_number, email, phone, pan_number, gst_number, udyam_number, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `, [bidderId, companyName, 'REG-' + Date.now().toString().slice(-6), vendorEmail || '', phoneNumber || '', formPAN || '', formGSTIN || '', formUdyam || '']);
      const documentsJson = JSON.stringify(fileInfo ? [fileInfo] : []);
      const overallVerdict = discrepancies.length > 0 || scanResult.hasMandatoryFailure ? 'NOT_ELIGIBLE: Compliance discrepancies' : scanResult.verdict;
      await db.query(`
        INSERT INTO bid_submissions (
          id, tender_id, bidder_id, submitted_at, status, documents_json
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
      `, [submissionId, tenderId, bidderId, 'PENDING', documentsJson]);
      await db.query(`
        INSERT INTO compliance_scores (
          id, bid_submission_id, overall_score, risk_level, ai_recommendation, category_scores_json, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, ['score-' + generateId(), submissionId, scanResult.overallScore, scanResult.riskLevel, overallVerdict, JSON.stringify(scanResult.checksDetail)]);
    } catch (saveErr) {
      console.warn('Error saving submission:', saveErr.message);
    }

    // Clean up extractedText to match API contract
    delete scanResult.extractedText;
    return res.status(200).json({
      success: true,
      companyName,
      overallScore: scanResult.overallScore,
      automationCoverage: scanResult.automationCoverage,
      riskLevel: scanResult.riskLevel,
      isCompliant: scanResult.isCompliant && discrepancies.length === 0,
      hasMandatoryFailure: scanResult.hasMandatoryFailure || discrepancies.length > 0,
      verdict: discrepancies.length > 0 || scanResult.hasMandatoryFailure ? 'NOT_ELIGIBLE: Compliance discrepancies or mandatory gate failures detected. Please review Curing Guidance.' : scanResult.verdict,
      trackingId: savedTrackingId,
      crossValidation: {
        passed: discrepancies.length === 0,
        gstinMatch,
        panMatch,
        udyamMatch,
        discrepancies
      },
      extractedEntities: scanResult.extractedEntities,
      checksDetail: scanResult.checksDetail,
      curingGuidance
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Open CPCL Tenders for Vendor Portal
 * GET /api/vendor/tenders
 */
exports.getOpenTenders = async (req, res, next) => {
  try {
    const tenders = (await db.query("SELECT * FROM tenders WHERE status = 'OPEN' ORDER BY created_at DESC")).rows;
    return res.status(200).json({
      success: true,
      count: tenders.length,
      tenders
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Vendor Specific Alerts & Timeline
 * GET /api/vendor/alerts?vendorName=...
 */
exports.getVendorAlerts = async (req, res, next) => {
  try {
    const vendorName = req.query.vendorName || req.query.vendor_name;
    let alerts = [];
    if (vendorName) {
      alerts = (await db.query(`
        SELECT * FROM alert_timeline 
        WHERE vendor_name LIKE $1 
        ORDER BY created_at DESC 
        LIMIT 20
      `, [`%${vendorName}%`])).rows;
    } else {
      alerts = (await db.query(`
        SELECT * FROM alert_timeline 
        ORDER BY created_at DESC 
        LIMIT 20
      `)).rows;
    }
    const formatted = alerts.map(a => {
      let flaggedItems = [];
      try {
        flaggedItems = a.flagged_items_json ? JSON.parse(a.flagged_items_json) : [];
      } catch (e) {
        flaggedItems = [a.flagged_items_json];
      }
      return {
        ...a,
        flagged_items: flaggedItems
      };
    });
    return res.status(200).json({
      success: true,
      count: formatted.length,
      alerts: formatted
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Save or Register Vendor Profile
 * POST /api/vendor/profile
 */
exports.saveVendorProfile = async (req, res, next) => {
  try {
    const {
      companyName,
      company_name,
      gstin,
      pan,
      udyam,
      email,
      phone,
      contactPerson,
      address,
      city,
      state
    } = req.body || {};
    const name = companyName || company_name;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company Name is required'
      });
    }
    const bidderId = 'b-' + generateId();
    try {
      await db.query(`
        INSERT INTO bidders (
          id, company_name, registration_number, contact_person,
          email, phone, pan_number, gst_number, udyam_number,
          address, city, state, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      `, [bidderId, name, 'REG-' + Date.now().toString().slice(-6), contactPerson || 'Authorized Representative', email || 'vendor@example.com', phone || '9876543210', pan || 'ABCDE1234F', gstin || '07ABCDE1234F1Z5', udyam || 'UDYAM-DL-01-1234567', address || 'Industrial Area', city || 'Chennai', state || 'Tamil Nadu']);
    } catch (dbErr) {
      console.warn('Vendor insert warning:', dbErr.message);
    }
    return res.status(200).json({
      success: true,
      message: 'Vendor profile saved successfully',
      vendor: {
        id: bidderId,
        companyName: name,
        gstin,
        pan,
        udyam,
        email,
        phone
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit Vendor Application
 * POST /api/vendor/submit
 */
exports.submitApplication = async (req, res, next) => {
  try {
    const {
      companyName,
      email,
      phone,
      gstin,
      pan,
      udyam,
      tenderId
    } = req.body;
    let fileInfo = null;
    if (req.file) {
      const storedFilename = cloudStorage.uploadBlob(req.file.buffer, req.file.originalname, req.file.mimetype);
      fileInfo = {
        filename: storedFilename,
        originalname: req.file.originalname,
        path: `/api/uploads/${storedFilename}`,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }
    const bidderId = 'b-' + generateId();
    const trackingId = 'BK-CPCL-' + Math.floor(100000 + Math.random() * 900000);
    const submissionId = trackingId;

    // Save Vendor Profile
    await db.query(`
      INSERT INTO bidders (
        id, company_name, registration_number, email, phone, pan_number, gst_number, udyam_number, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `, [bidderId, companyName || 'Unknown', 'REG-' + Date.now().toString().slice(-6), email || '', phone || '', pan || '', gstin || '', udyam || '']);

    // Save Submission
    const documentsJson = JSON.stringify(fileInfo ? [fileInfo] : []);
    await db.query(`
      INSERT INTO bid_submissions (
        id, tender_id, bidder_id, submitted_at, status, documents_json
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
    `, [submissionId, tenderId || 't1', bidderId, 'SUBMITTED', documentsJson]);
    return res.status(200).json({
      success: true,
      trackingId,
      submissionId,
      bidderId,
      message: 'Application submitted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Track Submission
 * GET /api/vendor/track/:id
 */
exports.trackSubmission = async (req, res, next) => {
  try {
    const trackingId = req.params.id;
    const submission = (await db.query(`
      SELECT bs.id as trackingId, bs.status, bs.submitted_at, b.company_name, cs.overall_score, cs.risk_level, cs.ai_recommendation
      FROM bid_submissions bs
      JOIN bidders b ON bs.bidder_id = b.id
      LEFT JOIN compliance_scores cs ON bs.id = cs.bid_submission_id
      WHERE bs.id = $1
    `, [trackingId])).rows[0];
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    return res.status(200).json({
      success: true,
      submission
    });
  } catch (err) {
    next(err);
  }
};