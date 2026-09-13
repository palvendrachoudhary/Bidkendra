const { delay } = require('../../utils/helpers');

exports.verify = async (bidderId) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    licenseNumber: 'LL-' + Math.floor(Math.random() * 100000),
    validity: 'Valid'
  };
};
