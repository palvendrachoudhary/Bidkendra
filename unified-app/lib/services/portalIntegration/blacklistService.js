const { delay } = require('../../utils/helpers');

exports.check = async (identifier) => {
  await delay(Math.floor(Math.random() * 400) + 100);
  
  // 5% chance of being blacklisted for demonstration
  const isBlacklisted = Math.random() < 0.05;
  
  return {
    blacklisted: isBlacklisted,
    debarred: isBlacklisted,
    details: isBlacklisted ? 'Debarred by Ministry of Defence for 3 years' : 'Clear'
  };
};
