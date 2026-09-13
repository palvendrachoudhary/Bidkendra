const {
  v4: uuidv4
} = require('uuid');
const db = require('../config/database');
exports.uploadBlob = async (fileBuffer, originalName, mimeType) => {
  const id = uuidv4();
  const base64Data = fileBuffer.toString('base64');
  const filename = `${id}-${originalName}`;
  await db.query(`
    INSERT INTO cloud_blobs (id, filename, mimetype, base64_data)
    VALUES ($1, $1, $1, $1)
  `, [id, filename, mimeType, base64Data]);
  try {
    if (typeof db.save === 'function') {
      db.save();
    }
  } catch (err) {}
  return filename;
};
exports.getBlob = async filename => {
  return (await db.query("SELECT * FROM cloud_blobs WHERE filename = $1", [filename])).rows[0];
};