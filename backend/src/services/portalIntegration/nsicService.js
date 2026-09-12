const { delay } = require('../../utils/helpers');

exports.verify = async (nsicNumber) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  return {
    verified: true,
    nsicNumber: nsicNumber || 'NSIC/DL/GP/123',
    registrationDate: '2019-10-10',
    validTill: '2027-10-09',
    category: 'Micro'
  };
};
