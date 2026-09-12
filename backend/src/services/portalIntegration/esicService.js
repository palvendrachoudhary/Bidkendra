const { delay } = require('../../utils/helpers');

exports.verify = async (registrationDetails) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    esicNumber: '11001234560001001',
    registrationDate: '2015-03-10',
    complianceStatus: 'Compliant'
  };
};
