const express = require('express');
const { getAuditLogs, getEntityAudit } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'AUDITOR', 'OFFICER'));

router.get('/', getAuditLogs);

router.get('/:entityType/:entityId', getEntityAudit);

module.exports = router;
