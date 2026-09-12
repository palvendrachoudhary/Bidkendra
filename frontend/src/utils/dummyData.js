export const stats = {
  totalTenders: 1245,
  pendingVerifications: 432,
  complianceRate: 87,
  activeBidders: 8904
};

export const tenders = [
  { id: 'CPCL/2026/T/1', title: 'Refinery Pipeline Expansion Phase 3', dept: 'Ministry of Petroleum & Natural Gas / CPCL', value: '₹145,00,000', status: 'Active', closingDate: '2026-10-15T18:00:00Z', bids: 12 },
  { id: 'CPCL/2026/T/2', title: 'Solar Panels for CPCL Facilities', dept: 'Ministry of Petroleum & Natural Gas / CPCL', value: '₹12,50,000', status: 'Active', closingDate: '2026-09-30T15:00:00Z', bids: 5 },
  { id: 'CPCL/2026/T/3', title: 'Security Surveillance System Upgrade', dept: 'Ministry of Petroleum & Natural Gas / CPCL', value: '₹85,00,000', status: 'Pending', closingDate: '2026-09-25T12:00:00Z', bids: 0 },
  { id: 'CPCL/2026/T/4', title: 'Heavy Duty Industrial Valves', dept: 'Ministry of Petroleum & Natural Gas / CPCL', value: '₹2,50,00,000', status: 'Active', closingDate: '2026-11-01T10:00:00Z', bids: 25 },
  { id: 'CPCL/2026/T/5', title: 'Lab Equipment Procurement', dept: 'Ministry of Petroleum & Natural Gas / CPCL', value: '₹5,00,00,000', status: 'Completed', closingDate: '2026-08-15T18:00:00Z', bids: 8 }
];

export const bidders = [
  { id: 'BID101', name: 'PetroTech India Pvt Ltd', udyam: 'UDYAM-MH-12-0001234', status: 'Verified', score: 95 },
  { id: 'BID102', name: 'Global Energy Traders', udyam: 'UDYAM-DL-05-0005678', status: 'Pending', score: 65 },
  { id: 'BID103', name: 'Apex Industrial Valves', udyam: 'UDYAM-GJ-01-0009012', status: 'Failed', score: 40 },
  { id: 'BID104', name: 'Rapid Logistics (Oil)', udyam: 'UDYAM-TN-02-0003456', status: 'Verified', score: 88 },
  { id: 'BID105', name: 'Secure IT Networks', udyam: 'UDYAM-KA-09-0007890', status: 'Verified', score: 92 }
];

export const recentActivity = [
  { id: 1, action: 'Bidder Verified', entity: 'PetroTech India Pvt Ltd', user: 'Admin System', time: '2026-09-10T10:30:00Z', status: 'Success' },
  { id: 2, action: 'Document Rejected', entity: 'Global Energy Traders (GST)', user: 'AI Engine', time: '2026-09-10T09:15:00Z', status: 'Failed' },
  { id: 3, action: 'Tender Published', entity: 'CPCL/2026/T/4', user: 'CPCL Procurement', time: '2026-09-09T16:45:00Z', status: 'Success' },
  { id: 4, action: 'Anomaly Detected', entity: 'Apex Industrial Valves', user: 'AI Engine', time: '2026-09-09T14:20:00Z', status: 'Warning' },
  { id: 5, action: 'Verification Started', entity: 'Rapid Logistics (Oil)', user: 'System', time: '2026-09-08T11:00:00Z', status: 'Info' }
];

export const complianceDistribution = [
  { label: 'High Compliance (80-100)', value: 65, color: '#10b981' },
  { label: 'Medium Compliance (50-79)', value: 25, color: '#f59e0b' },
  { label: 'Low Compliance (0-49)', value: 10, color: '#ef4444' }
];

export const verificationDetails = {
  digilocker: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  udyam: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  gst: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  pan: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  incomeTax: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  makeInIndia: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  epfo: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  esic: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  startup: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  nsic: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  oem: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  blacklist: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  mca: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' },
  labourLicense: { checkStatus: 'NOT_CONFIGURED', method: 'NONE', source: 'Not Configured', message: 'Awaiting document scan.' }
};