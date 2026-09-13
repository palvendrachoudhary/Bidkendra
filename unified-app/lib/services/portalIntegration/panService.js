const { delay } = require('../../utils/helpers');

exports.verify = async (panNumber) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    panNumber,
    name: 'Tech Solutions India Pvt Ltd',
    status: 'Active',
    aadhaarLinked: true,
    lastITRFiled: 'AY2025-26',
    itCompliance: 'Compliant'
  };
};
