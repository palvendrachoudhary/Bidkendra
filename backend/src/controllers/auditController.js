const db = require('../config/database');
const {
  sendResponse
} = require('../utils/helpers');
exports.getAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const logs = (await db.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset])).rows;
    sendResponse(res, 200, true, logs, 'Audit logs retrieved');
  } catch (err) {
    next(err);
  }
};
exports.getEntityAudit = async (req, res, next) => {
  try {
    const {
      entityType,
      entityId
    } = req.params;
    const logs = (await db.query("SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC", [entityType, entityId])).rows;
    sendResponse(res, 200, true, logs, 'Entity audit logs retrieved');
  } catch (err) {
    next(err);
  }
};