const db = require('../config/database');
const {
  sendResponse
} = require('../utils/helpers');
exports.getStats = async (req, res, next) => {
  try {
    const totalTenders = (await db.query("SELECT COUNT(*) as count FROM tenders")).rows[0].count;
    const activeTenders = (await db.query("SELECT COUNT(*) as count FROM tenders WHERE status = 'OPEN'")).rows[0].count;
    const totalBidders = (await db.query("SELECT COUNT(*) as count FROM bidders")).rows[0].count;
    const totalSubmissions = (await db.query("SELECT COUNT(*) as count FROM bid_submissions")).rows[0].count;
    const avgScoreObj = (await db.query("SELECT AVG(overall_score) as avg FROM compliance_scores")).rows[0];
    const avgScore = avgScoreObj.avg ? Math.round(avgScoreObj.avg * 100) / 100 : 0;
    const riskLevels = (await db.query("SELECT risk_level, COUNT(*) as count FROM compliance_scores GROUP BY risk_level")).rows;
    sendResponse(res, 200, true, {
      totalTenders,
      activeTenders,
      totalBidders,
      totalSubmissions,
      avgComplianceScore: avgScore,
      riskDistribution: riskLevels
    }, 'Stats retrieved');
  } catch (err) {
    next(err);
  }
};
exports.getRecentActivity = async (req, res, next) => {
  try {
    const logs = (await db.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10")).rows;
    sendResponse(res, 200, true, logs, 'Recent activity retrieved');
  } catch (err) {
    next(err);
  }
};
exports.getComplianceDistribution = async (req, res, next) => {
  try {
    const scores = (await db.query("SELECT overall_score FROM compliance_scores")).rows;
    // In a real scenario, group these into buckets
    sendResponse(res, 200, true, scores, 'Compliance distribution retrieved');
  } catch (err) {
    next(err);
  }
};
exports.getRiskOverview = async (req, res, next) => {
  try {
    const overview = (await db.query("SELECT risk_level, COUNT(*) as count FROM compliance_scores GROUP BY risk_level")).rows;
    sendResponse(res, 200, true, overview, 'Risk overview retrieved');
  } catch (err) {
    next(err);
  }
};