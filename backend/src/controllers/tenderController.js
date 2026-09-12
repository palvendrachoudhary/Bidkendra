const db = require('../config/database');
const {
  generateId,
  sendResponse
} = require('../utils/helpers');
exports.getTenders = async (req, res, next) => {
  try {
    const tenders = (await db.query("SELECT * FROM tenders ORDER BY created_at DESC")).rows;
    sendResponse(res, 200, true, tenders, 'Tenders retrieved successfully');
  } catch (err) {
    next(err);
  }
};
exports.getTender = async (req, res, next) => {
  try {
    const tender = (await db.query("SELECT * FROM tenders WHERE id = $1", [req.params.id])).rows[0];
    if (!tender) {
      return sendResponse(res, 404, false, null, 'Tender not found');
    }
    sendResponse(res, 200, true, tender, 'Tender retrieved successfully');
  } catch (err) {
    next(err);
  }
};
exports.createTender = async (req, res, next) => {
  try {
    const {
      title,
      tender_number,
      department,
      category,
      deadline,
      description
    } = req.body;
    const id = generateId();
    await db.query('INSERT INTO tenders (id, title, tender_number, department, category, deadline, status, description, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [id, title, tender_number, department, category, deadline, 'OPEN', description, req.user.id]);
    const newTender = (await db.query("SELECT * FROM tenders WHERE id = $1", [id])).rows[0];
    sendResponse(res, 201, true, newTender, 'Tender created successfully');
  } catch (err) {
    next(err);
  }
};
exports.updateTender = async (req, res, next) => {
  try {
    const {
      title,
      department,
      category,
      deadline,
      status,
      description
    } = req.body;
    await db.query('UPDATE tenders SET title = $1, department = $2, category = $3, deadline = $4, status = $5, description = $6 WHERE id = $7', [title, department, category, deadline, status, description, req.params.id]);
    const updatedTender = (await db.query("SELECT * FROM tenders WHERE id = $1", [req.params.id])).rows[0];
    sendResponse(res, 200, true, updatedTender, 'Tender updated successfully');
  } catch (err) {
    next(err);
  }
};
exports.getTenderSubmissions = async (req, res, next) => {
  try {
    const submissions = (await db.query(`
      SELECT bs.*, b.company_name, cs.overall_score, cs.risk_level
      FROM bid_submissions bs
      JOIN bidders b ON bs.bidder_id = b.id
      LEFT JOIN compliance_scores cs ON bs.id = cs.bid_submission_id
      WHERE bs.tender_id = $1
    `, [req.params.id])).rows;
    sendResponse(res, 200, true, submissions, 'Submissions retrieved successfully');
  } catch (err) {
    next(err);
  }
};