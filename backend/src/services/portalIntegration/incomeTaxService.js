const { delay } = require('../../utils/helpers');

exports.verify = async (panNumber) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    panNumber,
    lastItrFiled: '2025-26',
    itrStatus: 'Processed',
    complianceStatus: 'Compliant'
  };
};
