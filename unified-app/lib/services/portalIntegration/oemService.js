const { delay } = require('../../utils/helpers');

exports.verify = async (bidderId) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    authorizationNumber: 'OEM-AUTH-' + Math.floor(Math.random() * 10000),
    validUntil: '2027-12-31'
  };
};
