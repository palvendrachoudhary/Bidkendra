const { delay } = require('../../utils/helpers');

exports.verify = async (bidderId) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    localContentPercentage: Math.floor(Math.random() * 40) + 60, // 60-100%
    status: 'Class-I Local Supplier'
  };
};
