const { delay } = require('../../utils/helpers');

exports.verify = async (documentIds) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    documentsAvailable: ['PAN', 'Aadhaar', 'Driving License'],
    verificationStatus: 'Authentic'
  };
};
