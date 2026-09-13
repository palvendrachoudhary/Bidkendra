const { delay } = require('../../utils/helpers');

exports.verify = async (gstNumber) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    gstNumber,
    legalName: 'Tech Solutions India Pvt Ltd',
    tradeName: 'Tech Solutions',
    registrationDate: '2017-07-01',
    status: 'Active',
    lastReturnFiled: '2026-08-20',
    returnFilingStatus: 'Compliant',
    stateCode: gstNumber.substring(0, 2)
  };
};
