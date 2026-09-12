const fs = require('fs');
const path = require('path');
const {
  calculateScores,
  generateRecommendation
} = require('./scoringService');
const {
  COMPLIANCE_CATEGORIES
} = require('../config/constants');
const db = require('../config/database');
const {
  generateId
} = require('../utils/helpers');

// Load all mock services dynamically
const portalServices = {};
const servicesDir = path.join(__dirname, 'portalIntegration');
if (fs.existsSync(servicesDir)) {
  fs.readdirSync(servicesDir).forEach(file => {
    if (file.endsWith('.js')) {
      const serviceName = file.split('.')[0];
      portalServices[serviceName] = require(path.join(servicesDir, file));
    }
  });
}
exports.runVerification = async (bidderId, submissionId, userId) => {
  const bidder = (await db.query("SELECT * FROM bidders WHERE id = $1", [bidderId])).rows[0];
  if (!bidder) throw new Error('Bidder not found');
  const results = {};

  // Run all available verifications concurrently
  const tasks = [];
  const safeVerify = (promise, category, isBlacklist = false) => {
    return promise.then(res => results[category] = res).catch(err => {
      if (isBlacklist) {
        results[category] = {
          blacklisted: true,
          error: err.message || 'Service failed'
        };
      } else {
        results[category] = {
          verified: false,
          error: err.message || 'Service failed'
        };
      }
    });
  };
  if (portalServices.udyamService && bidder.udyam_number) {
    tasks.push(safeVerify(portalServices.udyamService.verify(bidder.udyam_number), COMPLIANCE_CATEGORIES.UDYAM));
  }
  if (portalServices.gstService && bidder.gst_number) {
    tasks.push(safeVerify(portalServices.gstService.verify(bidder.gst_number), COMPLIANCE_CATEGORIES.GST));
  }
  if (portalServices.panService && bidder.pan_number) {
    tasks.push(safeVerify(portalServices.panService.verify(bidder.pan_number), COMPLIANCE_CATEGORIES.PAN));
  }
  if (portalServices.epfoService) {
    tasks.push(safeVerify(portalServices.epfoService.verify(bidder.pan_number), COMPLIANCE_CATEGORIES.EPFO));
  }
  if (portalServices.blacklistService) {
    tasks.push(safeVerify(portalServices.blacklistService.check(bidder.pan_number), COMPLIANCE_CATEGORIES.BLACKLIST, true));
  }
  if (portalServices.digilockerService) {
    tasks.push(safeVerify(portalServices.digilockerService.verify(bidder.id), COMPLIANCE_CATEGORIES.DIGILOCKER));
  }
  if (portalServices.incomeTaxService) {
    tasks.push(safeVerify(portalServices.incomeTaxService.verify(bidder.pan_number), COMPLIANCE_CATEGORIES.INCOME_TAX));
  }
  if (portalServices.makeInIndiaService) {
    tasks.push(safeVerify(portalServices.makeInIndiaService.verify(bidder.id), COMPLIANCE_CATEGORIES.MAKE_IN_INDIA));
  }
  if (portalServices.esicService) {
    tasks.push(safeVerify(portalServices.esicService.verify(bidder.id), COMPLIANCE_CATEGORIES.ESIC));
  }
  if (portalServices.startupIndiaService) {
    tasks.push(safeVerify(portalServices.startupIndiaService.verify(bidder.id), COMPLIANCE_CATEGORIES.STARTUP));
  }
  if (portalServices.nsicService) {
    tasks.push(safeVerify(portalServices.nsicService.verify(bidder.id), COMPLIANCE_CATEGORIES.NSIC));
  }
  if (portalServices.oemService) {
    tasks.push(safeVerify(portalServices.oemService.verify(bidder.id), COMPLIANCE_CATEGORIES.OEM));
  }
  if (portalServices.mcaService) {
    tasks.push(safeVerify(portalServices.mcaService.verify(bidder.pan_number), COMPLIANCE_CATEGORIES.MCA));
  }
  if (portalServices.labourLicenseService) {
    tasks.push(safeVerify(portalServices.labourLicenseService.verify(bidder.id), COMPLIANCE_CATEGORIES.LABOUR_LICENSE));
  }
  await Promise.all(tasks);
  const scores = calculateScores(results);
  const recommendation = generateRecommendation(scores, results);

  // Save results to DB (no transaction wrapper needed for SQLite single-connection)
  // Clear old scores and checks if any
  await db.query("DELETE FROM compliance_scores WHERE bid_submission_id = $1", [submissionId]);
  await db.query("DELETE FROM compliance_checks WHERE bid_submission_id = $1", [submissionId]);

  // Save detailed checks
  for (const [category, result] of Object.entries(results)) {
    const status = category === COMPLIANCE_CATEGORIES.BLACKLIST ? result.blacklisted ? 'FAILED' : 'PASSED' : result.verified ? 'PASSED' : 'FAILED';
    await db.query("INSERT INTO compliance_checks (id, bid_submission_id, category, status, score, details_json, verified_by) VALUES ($1, $2, $3, $4, $5, $6, $7)", [generateId(), submissionId, category, status, scores.categoryScores[category] || 0, JSON.stringify(result), userId]);
  }

  // Save overall score
  await db.query("INSERT INTO compliance_scores (id, bid_submission_id, overall_score, risk_level, ai_recommendation, category_scores_json) VALUES ($1, $2, $3, $4, $5, $6)", [generateId(), submissionId, scores.overallScore, scores.riskLevel, recommendation, JSON.stringify(scores.categoryScores)]);

  // Update submission status
  await db.query("UPDATE bid_submissions SET status = \"VERIFIED\" WHERE id = $1", [submissionId]);

  // Log audit
  const auditDetail = 'Verification completed with score ' + scores.overallScore;
  await db.query("INSERT INTO audit_logs (id, action, entity_type, entity_id, user_id, details) VALUES ($1, $2, $3, $4, $5, $6)", [generateId(), 'VERIFICATION_RUN', 'bid_submission', submissionId, userId, auditDetail]);
  return {
    scores,
    results,
    recommendation
  };
};