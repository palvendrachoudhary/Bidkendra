const { delay } = require('../../utils/helpers');

exports.verify = async (cin) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  if (!cin) return { verified: false };

  return {
    verified: true,
    cin: cin || 'U72900DL2018PTC333444',
    companyName: 'Tech Solutions India Pvt Ltd',
    status: 'Active',
    incorporationDate: '2018-05-20',
    authorizedCapital: 1000000,
    paidUpCapital: 100000,
    directors: ['Director One', 'Director Two']
  };
};
