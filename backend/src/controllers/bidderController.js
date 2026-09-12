const db = require('../config/database');
const {
  generateId,
  sendResponse
} = require('../utils/helpers');
exports.getBidders = async (req, res, next) => {
  try {
    const bidders = (await db.query(`
      SELECT b.*, bs.id as submission_id, bs.documents_json, cs.overall_score, cs.category_scores_json 
      FROM bidders b 
      LEFT JOIN bid_submissions bs ON b.id = bs.bidder_id
      LEFT JOIN compliance_scores cs ON bs.id = cs.bid_submission_id
      ORDER BY b.created_at DESC
    `)).rows;
    sendResponse(res, 200, true, bidders, 'Bidders retrieved successfully');
  } catch (err) {
    next(err);
  }
};
exports.getBidder = async (req, res, next) => {
  try {
    const bidder = (await db.query("SELECT * FROM bidders WHERE id = $1", [req.params.id])).rows[0];
    if (!bidder) {
      return sendResponse(res, 404, false, null, 'Bidder not found');
    }
    const history = (await db.query(`
      SELECT bs.id as submission_id, t.tender_number, t.title, cs.overall_score, cs.risk_level, cs.created_at
      FROM bid_submissions bs
      JOIN tenders t ON bs.tender_id = t.id
      LEFT JOIN compliance_scores cs ON bs.id = cs.bid_submission_id
      WHERE bs.bidder_id = $1
    `, [req.params.id])).rows;
    bidder.compliance_history = history;
    sendResponse(res, 200, true, bidder, 'Bidder retrieved successfully');
  } catch (err) {
    next(err);
  }
};
exports.addBidder = async (req, res, next) => {
  try {
    const {
      company_name,
      registration_number,
      contact_person,
      email,
      phone,
      pan_number,
      gst_number,
      udyam_number,
      address,
      city,
      state
    } = req.body;
    const id = generateId();
    await db.query('INSERT INTO bidders (id, company_name, registration_number, contact_person, email, phone, pan_number, gst_number, udyam_number, address, city, state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)', [id, company_name, registration_number, contact_person, email, phone, pan_number, gst_number, udyam_number, address, city, state]);
    const newBidder = (await db.query("SELECT * FROM bidders WHERE id = $1", [id])).rows[0];
    sendResponse(res, 201, true, newBidder, 'Bidder added successfully');
  } catch (err) {
    next(err);
  }
};
exports.triggerVerification = async (req, res, next) => {
  // Normally this would queue a job, for hackathon we just forward to the verify API or run it sync
  sendResponse(res, 200, true, {
    message: 'Verification triggered for bidder ' + req.params.id
  });
};