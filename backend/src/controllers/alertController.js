/**
 * Alert Timeline Controller
 * Manages in-app Active Bid Curing timeline history, manual trigger dispatch,
 * and automated Viasocket webhook delivery logging.
 */

const axios = require('axios');
const db = require('../config/database');
const {
  generateId
} = require('../utils/helpers');

/**
 * Get Alert Timeline
 * GET /api/alerts/timeline?vendor_name=...&limit=...
 */
exports.getAlertTimeline = async (req, res, next) => {
  try {
    const vendorName = req.query.vendor_name || req.query.vendorName;
    const limit = parseInt(req.query.limit, 10) || 50;
    let rows = [];
    if (vendorName) {
      rows = (await db.query(`
        SELECT * FROM alert_timeline 
        WHERE vendor_name LIKE $1
        ORDER BY created_at DESC 
        LIMIT $2
      `, [`%${vendorName}%`, limit])).rows;
    } else {
      rows = (await db.query(`
        SELECT * FROM alert_timeline 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit])).rows;
    }
    const alerts = rows.map(r => {
      let flaggedItems = [];
      try {
        flaggedItems = r.flagged_items_json ? JSON.parse(r.flagged_items_json) : [];
      } catch (e) {
        flaggedItems = [r.flagged_items_json];
      }
      return {
        id: r.id,
        bidder_id: r.bidder_id,
        vendor_name: r.vendor_name,
        vendor_email: r.vendor_email,
        phone_number: r.phone_number,
        alert_type: r.alert_type,
        severity: r.severity || 'WARNING',
        title: r.title,
        message: r.message,
        flagged_items: flaggedItems,
        status: r.status,
        delivery_mode: r.delivery_mode,
        created_at: r.created_at
      };
    });
    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Trigger Active Bid Curing Alert (Manual or internal API dispatch)
 * POST /api/alerts/curing
 */
exports.triggerCuringAlert = async (req, res, next) => {
  try {
    const {
      vendor_name,
      vendorName,
      vendor_email,
      vendorEmail,
      phone_number,
      phoneNumber,
      bidder_id,
      bidderId,
      flagged_items = [],
      flaggedItems = [],
      severity = 'CRITICAL',
      title,
      message,
      tender_number = 'CPCL-2026-T1001'
    } = req.body || {};
    const targetVendor = vendor_name || vendorName || 'Vendor';
    const targetEmail = vendor_email || vendorEmail || 'vendor@example.com';
    const targetPhone = phone_number || phoneNumber || '';
    const targetBidderId = bidder_id || bidderId || null;
    const items = flagged_items && flagged_items.length > 0 ? flagged_items : flaggedItems;
    const alertTitle = title || `Active Bid Curing Notice: ${targetVendor}`;
    const alertMsg = message || `CPCL compliance verification flagged discrepancies in tender ${tender_number}. Rectification required: ${items.join(', ') || 'Statutory compliance documents'}.`;

    // 1. Dispatch to Viasocket Webhook
    const webhookUrl = process.env.VIASOCKET_WEBHOOK_URL || 'https://flow.sokt.io/func/scrioLbZ4rJB';
    let deliveryMode = 'live';
    const webhookPayload = {
      company_name: targetVendor,
      vendor_email: targetEmail,
      phone_number: targetPhone,
      decision_status: 'CURING_ALERT',
      severity,
      title: alertTitle,
      rejection_reason: alertMsg,
      flagged_items: items,
      emailContent: `Dear ${targetVendor},\n\nThis is an automated Active Bid Curing defect notice regarding your submission for CPCL tender ${tender_number}.\n\nFlagged Discrepancies:\n- ${items.join('\n- ')}\n\nPlease rectify these statutory items within 48 hours to ensure compliance.\n\nCPCL Procurement Cell`,
      timestamp: new Date().toISOString()
    };
    try {
      console.log(`[Curing Alert] Dispatching Viasocket notification for ${targetVendor}...`);
      await axios.post(webhookUrl, webhookPayload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      deliveryMode = 'live';
      console.log('[Curing Alert] Webhook delivered successfully.');
    } catch (whErr) {
      deliveryMode = 'simulated';
      console.warn(`[Curing Alert Warning] Webhook unreachable (${whErr.message}). Recorded as simulated.`);
    }

    // 2. Persist into alert_timeline
    const alertId = 'alt-cure-' + generateId();
    await db.query(`
      INSERT INTO alert_timeline (
        id, bidder_id, vendor_name, vendor_email, phone_number,
        alert_type, severity, title, message, flagged_items_json,
        status, delivery_mode, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
    `, [alertId, targetBidderId, targetVendor, targetEmail, targetPhone, 'WEBHOOK_CURING', severity, alertTitle, alertMsg, JSON.stringify(items), deliveryMode === 'live' ? 'DELIVERED' : 'SIMULATED', deliveryMode]);
    return res.status(200).json({
      success: true,
      alertId,
      deliveryMode,
      message: 'Active bid curing alert dispatched and recorded in timeline',
      payload: webhookPayload
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Record Custom Alert in Timeline
 * POST /api/alerts/timeline
 */
exports.recordTimelineAlert = async (req, res, next) => {
  try {
    const {
      bidder_id,
      vendor_name = 'Unknown Vendor',
      vendor_email,
      phone_number,
      alert_type = 'GENERAL_NOTICE',
      severity = 'INFO',
      title = 'Notice',
      message = '',
      flagged_items = [],
      status = 'DELIVERED',
      delivery_mode = 'live'
    } = req.body || {};
    const alertId = 'alt-' + generateId();
    await db.query(`
      INSERT INTO alert_timeline (
        id, bidder_id, vendor_name, vendor_email, phone_number,
        alert_type, severity, title, message, flagged_items_json,
        status, delivery_mode, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
    `, [alertId, bidder_id || null, vendor_name, vendor_email || null, phone_number || null, alert_type, severity, title, message, JSON.stringify(flagged_items), status, delivery_mode]);
    return res.status(201).json({
      success: true,
      alertId,
      message: 'Alert timeline event recorded successfully'
    });
  } catch (err) {
    next(err);
  }
};