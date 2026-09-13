const { delay } = require('../../utils/helpers');

exports.verify = async (udyamNumber) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  if (!udyamNumber) return { verified: false, error: 'No Udyam number provided' };

  return {
    verified: true,
    udyamNumber,
    enterpriseType: 'Small',
    category: 'Manufacturing',
    dateOfRegistration: '2020-05-15',
    nic2Digit: '26',
    state: 'Delhi',
    district: 'South Delhi'
  };
};
