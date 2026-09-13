const { Pool } = require('pg');

let pool = null;
let isConnected = false;

const inMemoryStore = {
  tenders: [
    {
      id: 't1',
      title: 'Supply of High-Pressure Seamless Steel Pipes for CPCL Manali Refinery',
      tender_number: 'CPCL/PROC/PIPE/2026/089',
      department: 'Pipelines & Mechanical',
      category: 'Goods',
      deadline: '2026-09-30T18:00:00.000Z',
      status: 'OPEN',
      description: 'Requirement for API 5L Grade X65 PSL2 Seamless Line Pipes with NACE MR0175 compliance for Chennai Petroleum Corporation Limited.',
      created_by: 'CPCL Tender Cell',
      created_at: new Date().toISOString()
    },
    {
      id: 't2',
      title: 'Annual Maintenance Contract for DCS and SCADA Instrumentation at CPCL Cauvery Basin',
      tender_number: 'CPCL/PROC/INST/2026/042',
      department: 'Instrumentation & Electrical',
      category: 'Services',
      deadline: '2026-10-15T18:00:00.000Z',
      status: 'OPEN',
      description: 'Comprehensive AMC for Honeywell Experion PKS DCS and Yokogawa Centum VP systems.',
      created_by: 'CPCL Operations Cell',
      created_at: new Date().toISOString()
    },
    {
      id: 't3',
      title: 'Catalyst Replacement & Hydrocracker Unit Revamp Works',
      tender_number: 'CPCL/PROC/CAT/2026/015',
      department: 'Refinery Process',
      category: 'Works',
      deadline: '2026-11-05T18:00:00.000Z',
      status: 'OPEN',
      description: 'Turnaround catalyst dumping, screening, skimming and fresh loading in Hydrocracker Unit.',
      created_by: 'CPCL Engineering Cell',
      created_at: new Date().toISOString()
    }
  ],
  bidders: [
    {
      id: 'b1',
      company_name: 'PetroTech India Pvt Ltd',
      registration_number: 'REG-882341',
      contact_person: 'Rajiv Malhotra',
      email: 'rajiv.m@petrotech.in',
      phone: '9840123456',
      pan_number: 'AABCP1234F',
      gst_number: '33AABCP1234F1Z5',
      udyam_number: 'UDYAM-TN-02-0045812',
      address: 'Plot 45, Guindy Industrial Estate',
      city: 'Chennai',
      state: 'Tamil Nadu',
      created_at: new Date().toISOString()
    },
    {
      id: 'b2',
      company_name: 'Bharat Piping & Infra Solutions Ltd',
      registration_number: 'REG-991204',
      contact_person: 'Anita Deshmukh',
      email: 'contracts@bharatpiping.com',
      phone: '9820554433',
      pan_number: 'AAACB5566K',
      gst_number: '27AAACB5566K1Z9',
      udyam_number: 'UDYAM-MH-01-0098124',
      address: 'MIDC Phase 2, Rabale',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      created_at: new Date().toISOString()
    }
  ],
  bid_submissions: [
    {
      id: 'BK-CPCL-741920',
      tender_id: 't1',
      bidder_id: 'b1',
      submitted_at: new Date().toISOString(),
      status: 'SUBMITTED',
      documents_json: JSON.stringify([{
        filename: 'PetroTech_Compliance_Doc.pdf',
        originalname: 'PetroTech_Compliance_Doc.pdf',
        path: '/api/uploads/PetroTech_Compliance_Doc.pdf',
        mimetype: 'application/pdf',
        size: 154200
      }])
    }
  ],
  compliance_scores: [
    {
      id: 'score-1',
      bid_submission_id: 'BK-CPCL-741920',
      overall_score: 96,
      risk_level: 'Low',
      ai_recommendation: 'HIGHLY_RECOMMENDED: Bidder satisfies all statutory thresholds.',
      category_scores_json: '{}',
      created_at: new Date().toISOString()
    }
  ],
  alert_timeline: [],
  audit_logs: []
};

async function initDatabase() {
  if (!pool) {
    const rawUrl = process.env.DATABASE_URL || '';
    if (rawUrl) {
      try {
        pool = new Pool({
          connectionString: rawUrl,
          ssl: rawUrl.includes('supabase') || rawUrl.includes('neon') ? { rejectUnauthorized: false } : undefined,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
        });
        const client = await pool.connect();
        isConnected = true;
        console.log('✅ Connected to PostgreSQL database');
        client.release();
      } catch (err) {
        console.warn('⚠️ PostgreSQL connection failed, operating with resilient memory fallback:', err.message);
        isConnected = false;
      }
    } else {
      console.log('ℹ️ No DATABASE_URL provided. Running in resilient mock database mode.');
    }
  }
  return pool;
}

async function query(sql, params = []) {
  if (pool && isConnected) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      console.warn('Database query error, falling back to memory store:', err.message);
    }
  }

  const lower = sql.toLowerCase().trim();

  if (lower.startsWith('select * from tenders')) {
    return { rows: inMemoryStore.tenders };
  }

  if (lower.includes('from bid_submissions') && lower.includes('join bidders')) {
    if (params.length > 0 && lower.includes('where bs.id = $1')) {
      const targetId = params[0];
      const sub = inMemoryStore.bid_submissions.find(s => s.id === targetId);
      if (!sub) return { rows: [] };
      const bidder = inMemoryStore.bidders.find(b => b.id === sub.bidder_id) || {};
      const score = inMemoryStore.compliance_scores.find(cs => cs.bid_submission_id === sub.id) || {};
      return {
        rows: [{
          trackingid: sub.id,
          status: sub.status,
          submitted_at: sub.submitted_at,
          company_name: bidder.company_name || 'Vendor Entity',
          overall_score: score.overall_score || 92,
          risk_level: score.risk_level || 'Low',
          ai_recommendation: score.ai_recommendation || 'VERIFIED_COMPLIANT'
        }]
      };
    }
    return { rows: inMemoryStore.bid_submissions };
  }

  if (lower.startsWith('select * from bidders') || lower.includes('from bidders b')) {
    const joined = inMemoryStore.bidders.map(b => {
      const sub = inMemoryStore.bid_submissions.find(s => s.bidder_id === b.id);
      return {
        ...b,
        bid_submission_id: sub ? sub.id : 'sub101',
        submission_status: sub ? sub.status : 'SUBMITTED',
        submitted_at: sub ? sub.submitted_at : b.created_at,
        documents_json: sub ? sub.documents_json : '[]'
      };
    });
    return { rows: joined };
  }

  if (lower.startsWith('insert into bidders')) {
    const newBidder = {
      id: params[0] || 'b-' + Date.now(),
      company_name: params[1] || 'Vendor Entity',
      registration_number: params[2] || 'REG-' + Date.now(),
      contact_person: params[3] || '',
      email: params[4] || '',
      phone: params[5] || '',
      pan_number: params[6] || '',
      gst_number: params[7] || '',
      udyam_number: params[8] || '',
      address: params[9] || '',
      city: params[10] || '',
      state: params[11] || '',
      created_at: new Date().toISOString()
    };
    inMemoryStore.bidders.push(newBidder);
    return { rows: [newBidder] };
  }

  if (lower.startsWith('insert into bid_submissions')) {
    const newSub = {
      id: params[0] || 'sub-' + Date.now(),
      tender_id: params[1] || 't1',
      bidder_id: params[2] || 'b1',
      submitted_at: new Date().toISOString(),
      status: params[3] || 'SUBMITTED',
      documents_json: params[4] || '[]'
    };
    inMemoryStore.bid_submissions.push(newSub);
    return { rows: [newSub] };
  }

  if (lower.startsWith('update bid_submissions set status = $1')) {
    const status = params[0];
    const id = params[1];
    const sub = inMemoryStore.bid_submissions.find(s => s.id === id);
    if (sub) sub.status = status;
    return { rows: sub ? [sub] : [] };
  }

  if (lower.startsWith('select * from alert_timeline')) {
    return { rows: inMemoryStore.alert_timeline };
  }

  if (lower.startsWith('insert into alert_timeline')) {
    const alert = {
      id: params[0] || 'alt-' + Date.now(),
      bidder_id: params[1] || null,
      vendor_name: params[2] || 'Vendor',
      vendor_email: params[3] || '',
      phone_number: params[4] || '',
      alert_type: params[5] || 'WARNING',
      severity: params[6] || 'WARNING',
      title: params[7] || 'Alert',
      message: params[8] || '',
      flagged_items_json: params[9] || '[]',
      status: params[10] || 'SENT',
      delivery_mode: params[11] || 'live',
      created_at: new Date().toISOString()
    };
    inMemoryStore.alert_timeline.unshift(alert);
    return { rows: [alert] };
  }

  if (lower.startsWith('select * from audit_logs')) {
    return { rows: inMemoryStore.audit_logs };
  }

  if (lower.startsWith('insert into audit_logs')) {
    const log = {
      id: params[0] || 'aud-' + Date.now(),
      action: params[1] || 'ACTION',
      entity_type: params[2] || 'entity',
      entity_id: params[3] || '',
      user_id: params[4] || 'u1',
      details: params[5] || '',
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    inMemoryStore.audit_logs.unshift(log);
    return { rows: [log] };
  }

  return { rows: [] };
}

const db = {
  init: initDatabase,
  query: query
};

module.exports = db;
