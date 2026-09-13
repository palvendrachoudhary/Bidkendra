const { delay } = require('../../utils/helpers');

exports.verify = async (dpiitNumber) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    dpiitNumber: dpiitNumber || 'DIPP12345',
    recognitionDate: '2021-08-15',
    sector: 'IT Services',
    stage: 'Early Traction'
  };
};
