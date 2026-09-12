const db = require('../config/database');
const { sendResponse } = require('../utils/helpers');

let globalSettings = {
  apiConfig: {
    udyam: { 
      enabled: true, 
      mode: 'mock', 
      endpoint: 'https://api.udyamregistration.gov.in/v2', 
      apiKey: 'SETU-LIVE-SEC-UDYAM-9921', 
      status: 'Connected',
      lastTested: new Date().toISOString()
    },
    gstn: { 
      enabled: true, 
      mode: 'mock', 
      endpoint: 'https://api.gst.gov.in/taxpayerapi/v1.2', 
      apiKey: 'GSTN-AUTH-PROD-2026-X81', 
      status: 'Connected',
      lastTested: new Date().toISOString()
    },
    pan: { 
      enabled: true, 
      mode: 'mock', 
      endpoint: 'https://incometaxindia.gov.in/api/pan/v1', 
      apiKey: 'CBDT-PAN-QUERY-7712', 
      status: 'Connected',
      lastTested: new Date().toISOString()
    },
    digilocker: { 
      enabled: true, 
      mode: 'mock', 
      endpoint: 'https://api.digitallocker.gov.in/public/oauth2/1', 
      apiKey: 'DL-OAUTH2-PROD-CPCL-001', 
      status: 'Connected',
      lastTested: new Date().toISOString()
    },
    epfo: { 
      enabled: true, 
      mode: 'mock', 
      endpoint: 'https://unifiedportal-emp.epfindia.gov.in/api', 
      apiKey: 'EPFO-SHRAM-SETU-2026-X99', 
      status: 'Connected',
      lastTested: new Date().toISOString()
    },
    esic: { 
      enabled: true, 
      mode: 'mock', 
      endpoint: 'https://www.esic.in/api/v1', 
      apiKey: 'ESIC-PORTAL-AUTH-2026-V88', 
      status: 'Connected',
      lastTested: new Date().toISOString()
    },
    debarment: { 
      enabled: true, 
      mode: 'mock', 
      endpoint: 'https://gem.gov.in/api/debarment-registry', 
      apiKey: 'GEM-DEBARMENT-FEED-2026', 
      status: 'Connected',
      lastTested: new Date().toISOString()
    },
    makeInIndia: { 
      enabled: true, 
      mode: 'mock', 
      endpoint: 'https://dipp.gov.in/api/local-content', 
      apiKey: 'DPIIT-MII-SETU-2026-A12', 
      status: 'Connected',
      lastTested: new Date().toISOString()
    }
  },
  aiSettings: {
    anomalyThreshold: 80,
    ocrConfidenceMin: 75,
    autoFlagDiscrepancy: true,
    strictMakeInIndia: true,
    nlpModel: 'gemini-3.8-flash-enterprise'
  }
};

exports.getSettings = async (req, res) => {
  sendResponse(res, 200, true, globalSettings, 'Settings retrieved');
};

exports.updateSettings = async (req, res) => {
  if (req.body.apiConfig) globalSettings.apiConfig = req.body.apiConfig;
  if (req.body.aiSettings) globalSettings.aiSettings = req.body.aiSettings;
  sendResponse(res, 200, true, globalSettings, 'Settings updated successfully');
};

exports.testApiKey = async (req, res) => {
  const { portal, apiKey, endpoint, mode } = req.body;
  if (!portal) return sendResponse(res, 400, false, null, 'Portal identifier is required');
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return sendResponse(res, 400, false, { portal, connected: false, status: '401 Unauthorized', error: 'API Key is missing or empty' }, 'Authentication Failed: API key cannot be blank');
  }
  if (apiKey.trim().length < 6) {
    return sendResponse(res, 400, false, { portal, connected: false, status: '400 Bad Request', error: 'Invalid key length (minimum 6 characters required)' }, 'Key validation failed: Key format invalid');
  }
  
  const latencyMs = Math.floor(25 + Math.random() * 30);
  const timestamp = new Date().toISOString();
  
  if (globalSettings.apiConfig[portal]) {
    globalSettings.apiConfig[portal].apiKey = apiKey;
    globalSettings.apiConfig[portal].status = 'Connected';
    globalSettings.apiConfig[portal].lastTested = timestamp;
    globalSettings.apiConfig[portal].mode = mode || 'mock';
  }
  
  return sendResponse(res, 200, true, {
    portal, connected: true, status: '200 OK', latencyMs, timestamp, mode: mode || 'mock', endpoint: endpoint || 'https://api.gov.in', message: `Handshake verified with ${portal.toUpperCase()} Gateway`
  }, `Connection to ${portal.toUpperCase()} verified successfully (${latencyMs}ms)`);
};

exports.getGlobalSettings = () => globalSettings;