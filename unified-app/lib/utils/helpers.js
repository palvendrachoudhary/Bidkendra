const { v4: uuidv4 } = require('uuid');

exports.generateId = () => {
  return uuidv4();
};

exports.formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

exports.sendResponse = (res, statusCode, success, data, message = '') => {
  return res.status(statusCode).json({
    success,
    data,
    message
  });
};

exports.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
