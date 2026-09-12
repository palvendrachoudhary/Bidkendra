const { delay } = require('../../utils/helpers');

exports.verify = async (panNumber) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  // Randomly simulate some compliance issues for realism
  const isCompliant = Math.random() > 0.2;
  
  return {
    verified: true,
    establishmentCode: 'DLCPM0012345000',
    employeeCount: Math.floor(Math.random() * 200) + 50,
    lastContribution: '2026-07',
    complianceStatus: isCompliant ? 'Compliant' : 'Pending Contribution'
  };
};
